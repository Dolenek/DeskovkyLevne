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

## Build-Time Data Sources
- Dynamic sitemap/prerender slugs come from `catalog_slug_summary`.
- Build scripts use Supabase client credentials from env vars.

## Fallback Behavior Without Supabase Credentials
If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, sitemap/prerender run in static-only mode and build still succeeds.

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
- Non-blocking aggregate refresh: `infra/rewrite/sql/refresh-catalog-aggregates-concurrently.sql`
- Legacy direct-read cutover: `infra/rewrite/sql/legacy-read-cutover.sql`
- Cutover rollback: `infra/rewrite/sql/legacy-read-cutover-rollback.sql`
- Legacy artifact cleanup: `infra/rewrite/sql/drop-legacy-product-catalog-index.sql`
