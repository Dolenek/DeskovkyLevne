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

## Backend Deployment (Go API)
- Service code: `apps/api-go`
- Compose stack: `infra/rewrite/docker-compose.api-go.yml`
- Deployment helper: `infra/rewrite/deploy-api-go.sh`
- Default published port: `${API_GO_PORT:-18080}`

Required runtime env:
- `DATABASE_URL`

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
The production nginx site serves `dist/` and proxies `/api/` to the Go API on
`${API_GO_PORT:-18080}`. The `/api/` location should apply a small request
limit keyed by `CF-Connecting-IP` when traffic arrives through Cloudflare Tunnel,
with a fallback to the direct remote address for local or non-Cloudflare
requests. This keeps stale browser bundles or malfunctioning clients from
saturating the API process.

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
- Non-blocking aggregate refresh: `infra/rewrite/sql/refresh-catalog-aggregates-concurrently.sql`
