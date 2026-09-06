# Continuous Deployment

## Trigger and CI Gate

Production checks `Dolenek/DeskovkyLevne`'s `main` branch every five minutes,
with up to 15 seconds of jitter after the previous check finishes. The systemd
timer also starts after host reboot. No inbound SSH from GitHub, GitHub token,
webhook endpoint, or production Actions runner is required for this public repo.

`infra/production/deploy.py` fetches `main` and checks the latest matching push
run of `.github/workflows/ci.yml` using the
[GitHub workflow runs API](https://docs.github.com/en/rest/actions/workflow-runs).
Only a completed, successful run for the exact current SHA, branch and repository
permits deployment. Pull requests, manual runs, failed/cancelled CI, pending
reruns and API errors do not authorize deployment. The separate `Security`
workflow is advisory and does not gate this deployment.

The server checks main and CI again after building. If main advanced, it leaves
production unchanged and checks the new revision on the next timer tick.
An exclusive file lock serializes deployments. A successfully deployed SHA is
not rebuilt on subsequent ticks. Failures are retried on the next tick.

## Release Process

1. Archive the selected Git revision into a new directory under
   `/var/lib/deskovky-deploy/releases`. The original server checkout is retained.
2. Run `npm ci`, install Playwright Chromium, and build under the unprivileged
   `deskovky-build` account with production `VITE_*` values. This preserves dynamic
   sitemap and product-preview generation. Builds have a 768 MiB Node heap cap.
3. Build the Go image with its full commit SHA embedded and use the existing
   Compose project `rewrite`, container names, loopback port and Redis volume.
   Effective Compose manifests are stored with mode `600` inside a mode `700`
   directory because they contain runtime credentials.
4. Record recovery state, update Compose with health checks, atomically switch
   the nginx `dist` symlink, and verify readiness, API commit identity, the
   catalog through nginx, and frontend HTML. API replacement can cause a brief
   interruption; this is not a zero-downtime deployment.
5. Record the successful SHA and preserve the previous frontend and manifest.
   An activation failure restores both components and checks them again. If the
   process or host stops during activation, the next run recovers the recorded
   previous release before considering another deployment.

The agent does not execute SQL migrations or change nginx/tunnel configuration.
Database changes must be backward compatible with the previous release; follow
the [data refresh runbook](data-refresh.md) for database operations.

## Host Installation

The production host is the SSH alias `DeskovkyLevneSite`. Prerequisites are
Python 3, Git, Bash, Node/npm supported by the application, Playwright system
libraries, nginx, Docker, and the Docker Compose plugin. The installed plugin
is v5.5.1; its upstream SHA-256 checksum is verified during provisioning.

The site is `/var/www/DeskovkyLevne`; its root-only `.env` supplies runtime
configuration. nginx serves port `4444` and proxies to API port `18080`.
The frontend is served through `/var/www/DeskovkyLevne/dist`, which points to
the active release. The bootstrap captures the existing API image and frontend
as the initial rollback target before enabling the timer.

As root, from a trusted copy of this repository:

```bash
python3 infra/production/bootstrap.py
systemctl start deskovky-deploy.service
```

Bootstrap installs the agent under `/usr/local/lib/deskovky-deploy` and systemd
units under `/etc/systemd/system`. Application pushes do not replace this
privileged agent. To update the agent itself, stop the timer, wait for any active
deployment to finish, review the new `infra/production` code and rerun bootstrap.

## Status and Recovery

```bash
systemctl list-timers deskovky-deploy.timer
systemctl status deskovky-deploy.service
journalctl -u deskovky-deploy.service -n 100 --no-pager
cat /var/lib/deskovky-deploy/deployed-sha
curl --fail http://127.0.0.1:18080/version
```

Deployment failures appear in the service journal and failed service status.
The timer retries; there is no separate email or chat notification integration.
GitHub Actions reports validation status; production deployment logs are on the
server. To pause automatic deployment:

```bash
systemctl stop deskovky-deploy.timer
```

This does not interrupt an active deployment. Prefer a reverted commit on main
for a normal rollback: CI validates it and the agent deploys it automatically.
For emergency restoration, first stop the timer and wait for the active service
to finish, then restore both saved components as root:

```bash
docker compose -p rewrite -f /var/lib/deskovky-deploy/previous-manifest \
  up -d --no-build --wait --wait-timeout 120
ln -s "$(readlink -f /var/lib/deskovky-deploy/previous-frontend)" \
  /var/www/DeskovkyLevne/dist.pending
mv -Tf /var/www/DeskovkyLevne/dist.pending /var/www/DeskovkyLevne/dist
curl --fail http://127.0.0.1:18080/ready
curl --fail http://127.0.0.1:4444/api/v1/catalog?limit=1
```

Keep the timer stopped until a corrected/reverted main commit is ready. Update
`active-manifest` and `deployed-sha` to the restored release before resuming so
the next automatic rollback also targets that restored release.

Old releases, failed builds and Docker images are retained for operator review.
Before building, the agent requires at least 5 GiB free. Monitor disk usage and
remove only releases/manifests/images that are not referenced by the active,
previous or pending deployment. Never run indiscriminate Docker pruning on this
shared host. Frontend dependencies are removed after successful builds.

## Verification

CI executes the gate and rollback regression tests without production access:

```bash
python3 -m unittest discover -s infra/production -p 'test_*.py'
```
