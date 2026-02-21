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
- Dynamic sitemap/prerender slugs come from `catalog_slug_summary`.
- Build scripts read `VITE_SUPABASE_URL` first, then `SUPABASE_URL`, then `DATABASE_URL` for URL resolution.
- Build scripts require `VITE_SUPABASE_ANON_KEY` for dynamic DB reads.

## Fallback Behavior Without Supabase Credentials
If no URL is resolved (`VITE_SUPABASE_URL`/`SUPABASE_URL`/`DATABASE_URL`) or `VITE_SUPABASE_ANON_KEY` is missing, sitemap/prerender run in static-only mode and build still succeeds.

## Prerender Requirements
```bash
npx playwright install chromium
```

## Backend Deployment (Go API)
- Service code: `apps/api-go`
- Compose stack: `infra/rewrite/docker-compose.api-go.yml`
- Deployment helper: `infra/rewrite/deploy-api-go.sh`
- Default published port: `${API_GO_PORT:-18080}`

Required runtime env:
- `DATABASE_URL`

## SQL Operations Used in Deployment/Cutover
- Recent endpoint index migration: `infra/db/migrations/20260218_recent_snapshots_index.sql`
- Index cleanup migration: `infra/db/migrations/20260221_phase1_index_cleanup.sql`
- Partitioned snapshots prepare: `infra/db/migrations/20260222_partitioned_snapshots_prepare.sql`
- Incremental state tables/function: `infra/db/migrations/20260223_incremental_catalog_state.sql`
- Incremental refresh function migration: `infra/db/migrations/20260224_incremental_catalog_refresh_function.sql`
- Non-blocking aggregate refresh: `infra/rewrite/sql/refresh-catalog-aggregates-concurrently.sql`
