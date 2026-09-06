#!/usr/bin/env python3
"""Outbound-only CD agent; never deploy a revision before CI succeeds."""
import fcntl
import shutil
import sys
import time

from github_gate import check_ci
from release import STATE, activate, build_frontend, command
from release import create_manifest, output, recover_pending, runtime_environment


def main():
    with (STATE / "lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        recover_pending()
        deploy_current_main()


def deploy_current_main():
    repository = STATE / "repository.git"
    command(["git", "--git-dir", str(repository), "fetch", "--prune", "origin",
             "+refs/heads/main:refs/heads/main"])
    revision = output(["git", "--git-dir", str(repository), "rev-parse", "refs/heads/main"])
    if (STATE / "deployed-sha").read_text().strip() == revision:
        print(f"Already deployed: {revision}", flush=True)
        return
    run_url = check_ci(revision)
    if not run_url:
        print(f"Waiting for successful push CI: {revision}", flush=True)
        return
    print(f"Deploying {revision}; CI: {run_url}", flush=True)
    release = prepare_release(repository, revision)
    environment = runtime_environment()
    build_frontend(release, environment)
    manifest = create_manifest(release, revision, environment)
    latest = output(["git", "--git-dir", str(repository), "ls-remote", "origin",
                     "refs/heads/main"]).split()[0]
    if latest != revision or not check_ci(revision):
        print("Main or CI changed during build; leaving production unchanged", flush=True)
        return
    activate(release, manifest, revision)
    print(f"Successfully deployed {revision}", flush=True)


def prepare_release(repository, revision):
    if shutil.disk_usage(STATE).free < 5 * 1024**3:
        raise RuntimeError("Less than 5 GiB free; clean old releases before deploying")
    release = STATE / "releases" / f"{revision}-{time.time_ns()}"
    release.mkdir(mode=0o755)
    archive = STATE / "source.tar"
    command(["git", "--git-dir", str(repository), "archive", "--format=tar",
             "--output", str(archive), revision])
    command(["tar", "-xf", str(archive), "-C", str(release)])
    archive.unlink()
    return release


if __name__ == "__main__":
    try:
        main()
    except BlockingIOError:
        print("Another deployment holds the lock", flush=True)
    except Exception as failure:
        print(f"Deployment failed: {failure}", file=sys.stderr, flush=True)
        sys.exit(1)
