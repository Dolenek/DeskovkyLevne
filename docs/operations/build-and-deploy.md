# Build and Deploy

## Local Development

Use Node.js 22.20+ or 24+ with npm, Go 1.26.8+, and PostgreSQL containing the
project read models. CI uses Node 24. Install the locked dependency tree:

```bash
npm ci
```

Copy `apps/api-go/.env.example` to `apps/api-go/.env` and configure
`DATABASE_URL`, or supply it through the process environment. See
[Configuration](configuration.md#backend-environment-variables-appsapi-go)
for precedence and proxy settings.

`npm run dev` starts the Go API and Vite together. Frontend options can be
forwarded, for example `npm run dev -- --host 127.0.0.1`. `npm run api:dev`
starts only the API with the same environment loading; `npm run dev:frontend`
starts only Vite. Invalid required configuration or a missing executable
produces a controlled failure. A child exit or SIGINT/SIGTERM stops the paired
services and their descendants. POSIX process groups receive SIGTERM followed
by SIGKILL after exit or a two-second grace period; Windows uses `taskkill /T /F`
for the owned process trees.

## Local Build Pipeline
Root command:
```bash
npm run build
```

Pipeline stages:
1. TypeScript build (`tsc -b`)
2. Sitemap generation (`node scripts/generate-sitemap.mjs`)
3. Vite production build (`vite build`) with the Tailwind 4 Vite plugin
4. Prerender pass (`node scripts/prerender.mjs`)

## Frontend/API Compatibility
Deploy the frontend and Go API together for catalog price sorting. The frontend
sends the `sort` query parameter; the API validates and applies it before
pagination. This feature does not require a database migration. See the
[HTTP API contract](../api/http-api.md#catalog).

## Continuous Integration
GitHub Actions runs the validation workflow for pull requests targeting `main`,
pushes to `main`, and manual dispatches. New commits cancel older runs for the
same ref. The workflow grants the GitHub token read-only repository access and
does not receive production secrets. The production server deploys successful
push revisions through the [continuous deployment agent](continuous-deployment.md).

The required CI jobs run in parallel:
- `Frontend`: installs locked npm dependencies, runs ESLint and Knip, validates managed
  SQL function privileges, runs Node and Vitest unit tests, builds the production
  frontend, and runs the Playwright E2E suite. Unit tests cover API retry and
  cancellation, product transformations, and static SQL migration contracts.
- `Backend`: runs all Go tests with race detection and then `go vet`. The unit
  suite uses repository and cache collaborators to exercise service failures,
  caching, request boundaries, and timeout behavior without external services.
- `Infrastructure`: validates the hardened Compose output, builds the Go API
  container, verifies nginx security headers and rate limiting, and tests the
  production CI gate and automatic rollback.

`npm run lint` checks frontend TypeScript, root JavaScript configuration,
shared JavaScript rules, and Node build/test scripts. `npm run check:unused` checks unused files, exports,
types, and dependencies across the frontend, scripts, and tests. Its
`knip.jsonc` project patterns exclude the separate `TlamaScraper` tree and
generated output. Playwright configuration/specs and Node unit tests are
explicit entry points; Vite, Vitest, and package scripts supply the other
entries. The `go` executable used by the Node development launcher is supplied
by the backend toolchain. Both checks run locally and in the frontend CI job.

CI does not receive Supabase build credentials. The frontend build therefore
uses the deterministic static-only fallback described below.

CI validates migration structure and privilege policy statically; it does not
apply the migration chain to a live PostgreSQL instance. Deployment verification
against PostgreSQL remains required as described in `data-refresh.md`.

The separate security workflow runs after pushes to `main`, on manual dispatch,
and every Monday at 04:17 UTC. It runs the strict npm dependency audit plus
`govulncheck` and `gosec`; these network-backed scans do not block pull requests.
Local security checks use `npm ci && npm audit` at the repository root and,
from `apps/api-go`, the scanner commands pinned in `.github/workflows/security.yml`.
The minimum Go version in `apps/api-go/go.mod` also selects the CI toolchain;
keep it aligned with the Docker builder version when applying security patches.

## Build Reliability Notes
- Keep dependency installations local to the operating system: do not share
  Windows `node_modules` with WSL/Linux. Run `npm ci` in the target environment
  to install the lockfile's native Rollup, Oxc, esbuild, and Tailwind Oxide packages.
- Dependency updates must preserve the complete optional platform and bundled
  WASM dependency graph in `package-lock.json`. Verify a fresh `npm ci` using
  the Node 24/npm toolchain used by CI, without an existing `node_modules` tree.

## Build-Time Data Sources
- Dynamic sitemap slugs and product preview pages come from `catalog_slug_state`.
- Product preview pages also read `catalog_slug_seller_state` so their static
  descriptions, Product JSON-LD offers, and social images can use per-seller
  prices and image fallbacks.
- Build scripts read `VITE_SUPABASE_URL` first, then `SUPABASE_URL`, then `DATABASE_URL` for URL resolution.
- Build scripts require `VITE_SUPABASE_ANON_KEY` for dynamic DB reads.

## Fallback Behavior Without Supabase Credentials
If no URL is resolved (`VITE_SUPABASE_URL`/`SUPABASE_URL`/`DATABASE_URL`) or `VITE_SUPABASE_ANON_KEY` is missing, sitemap/prerender run in static-only mode and build still succeeds.
Static-only mode does not write product-specific `/deskove-hry/:slug` preview
HTML, so crawlers receive only the generic SPA fallback for product routes.

## Prerender Requirements
```bash
npx playwright install chromium
```

On Linux, install Chromium's system libraries as well:

```bash
npx playwright install --with-deps chromium
```

Prerender waits for `domcontentloaded` and the SEO robots marker instead of
`networkidle`, because catalog pages can keep API activity open after the first
paint.

The browser prerender pass covers `/`, `/levne-deskovky`, and `/deskove-hry`.
Product route HTML is generated directly from the built SPA shell with
product-specific SEO tags for every slug from the build-time read model.

Before static HTML is written, absolute URLs that use the local prerender
origin are rewritten to `VITE_SITE_URL`, or to
`https://www.deskovkylevne.com` when the variable is unset. Canonical, Open
Graph, and JSON-LD URLs therefore never retain the local prerender host;
relative asset URLs are unchanged. Product preview prices accept only finite,
non-negative numeric values. Missing or invalid prices are omitted, while a
numeric zero remains valid.

## Backend Deployment (Go API)
- Service code: `apps/api-go`
- Compose stack: `infra/rewrite/docker-compose.api-go.yml`
- Deployment helper: `infra/rewrite/deploy-api-go.sh`
- Container baseline: Go `1.26.8` on Alpine `3.24`, with Alpine `3.24.1` at runtime
- Published port: loopback-only `127.0.0.1:${API_GO_PORT:-18080}`

Required runtime env:
- `DATABASE_URL`
- `FRONTEND_ORIGIN`
- `REDIS_PASSWORD`

Apply `infra/db/migrations/20260302_security_roles_and_rpc_lockdown.sql` before
starting an API configured with the default `API_DATABASE_ROLE`. The login role
from `DATABASE_URL` must be a member of `tlamasite_api`; refresh automation must
instead be a member of `tlamasite_maintenance`.

The deployment helper uses the Docker Compose plugin when available and falls
back to `docker-compose` v1 on hosts that do not have the plugin installed. The
compose stack starts Redis with a healthcheck before the API container so Redis
cache is available at API startup. The API container healthcheck calls `/ready`
and therefore also detects loss of PostgreSQL connectivity.

The helper embeds `API_VERSION`, `API_COMMIT`, and `API_BUILT_AT` as Go linker
values. Defaults come from the checked-out Git revision and the UTC build time.
After deployment, verify:

```bash
curl --fail http://localhost:${API_GO_PORT:-18080}/health
curl --fail http://localhost:${API_GO_PORT:-18080}/ready
curl --fail http://localhost:${API_GO_PORT:-18080}/version
curl --fail 'http://localhost:'${API_GO_PORT:-18080}'/api/v1/catalog?limit=1'
```

## Production Reverse Proxy
The canonical site configuration is `infra/rewrite/nginx/nginx.conf`. It serves
`dist/`, proxies `/api/` to the loopback-bound Go API, limits clients to 10
requests per second with a burst of 30, and emits the documented browser
security headers. Keep `API_TRUSTED_PROXY_CIDRS` limited to the actual reverse
proxy or tunnel peers; forwarded client-address headers from other peers are
ignored.

The API and Redis containers run with all capabilities dropped,
`no-new-privileges`, read-only root filesystems, and explicit writable mounts or
tmpfs only. Redis is password-protected and explicitly runs as its image's
unprivileged UID 999 and GID 1000 so the capability drop remains compatible
with its persistent data volume.

`infra/rewrite/test-nginx-security.sh` starts an isolated local nginx container
and verifies the production headers plus a `429` response after the configured
burst. The CI infrastructure job runs this check for pull requests and pushes
to `main`.

## SQL Operations Used in Deployment/Cutover
- Index cleanup migration: `infra/db/migrations/20260221_phase1_index_cleanup.sql`
- Partitioned snapshots prepare: `infra/db/migrations/20260222_partitioned_snapshots_prepare.sql`
- Incremental state tables/function: `infra/db/migrations/20260223_incremental_catalog_state.sql`
- Incremental refresh function migration: `infra/db/migrations/20260224_incremental_catalog_refresh_function.sql`
- Canonical product aliases: `infra/db/migrations/20260225_canonical_product_aliases.sql`
- Alias candidate review queue: `infra/db/migrations/20260226_canonical_alias_candidates.sql`
- Reviewed alias seed data: `infra/db/migrations/20260227_seed_canonical_product_aliases.sql`
- Alias-aware daily history refresh: `infra/db/migrations/20260228_canonical_daily_history_refresh.sql`
- Alias-aware catalog state refresh: `infra/db/migrations/20260229_canonical_catalog_state_refresh.sql`
- Safe alias lookup and presentation fallback:
  `infra/db/migrations/20260301_safe_alias_and_presentation_fallback.sql`
- Database roles, RLS policies, and RPC lockdown:
  `infra/db/migrations/20260302_security_roles_and_rpc_lockdown.sql`
- Non-blocking aggregate refresh: `infra/rewrite/sql/refresh-catalog-aggregates-concurrently.sql`
