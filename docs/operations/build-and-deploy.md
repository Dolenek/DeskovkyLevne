# Build and Deploy

## Local Build Pipeline
Root command:
```bash
npm run build
```

Pipeline stages:
1. TypeScript build (`tsc -b`)
2. Sitemap generation (`node scripts/generate-sitemap.mjs`)
3. Vite production build (`vite build`)
4. Prerender pass (`node scripts/prerender.mjs`)

## Continuous Integration
GitHub Actions runs the validation workflow for pull requests targeting `main`,
pushes to `main`, and manual dispatches. New commits cancel older runs for the
same ref. The workflow grants the GitHub token read-only repository access and
does not publish artifacts or deploy the application.

The required CI jobs run in parallel:
- `Frontend`: installs locked npm dependencies, runs ESLint, validates managed
  SQL function privileges, runs unit tests, builds the production frontend, and
  runs the Playwright E2E suite.
- `Backend`: runs all Go tests with race detection and then `go vet`.
- `Infrastructure`: validates the hardened Compose output, builds the Go API
  container, and verifies nginx security headers and rate limiting.

CI does not receive Supabase build credentials. The frontend build therefore
uses the deterministic static-only fallback described below.

The separate security workflow runs after pushes to `main`, on manual dispatch,
and every Monday at 04:17 UTC. It runs the strict npm dependency audit plus
`govulncheck` and `gosec`; these network-backed scans do not block pull requests.

## Build Reliability Notes
- In Linux/WSL environments, ensure optional Rollup binary packages are installed (for example `@rollup/rollup-linux-x64-gnu`). If missing, reinstall dependencies with `npm install`.

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
- Container baseline: Go `1.26.5` on Alpine `3.24`, with Alpine `3.24.1` at runtime
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
