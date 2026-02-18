# Configuration Reference

## Frontend Environment Variables

### Required for runtime
- `VITE_API_BASE_URL`
  - Default: `http://localhost:8080`
  - Purpose: backend API base URL used by browser runtime.

### Recommended for production SEO
- `VITE_SITE_URL`
  - Default: `https://www.deskovkylevne.com`
  - Purpose: absolute canonical/OG URL generation.

### Optional for dynamic build-time sitemap/prerender
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
  - If missing, sitemap/prerender run in static-only fallback mode.

### Optional frontend tuning
- `VITE_SUPABASE_SEARCH_LIMIT` (default `60`)
- `VITE_RECENT_DISCOUNT_LOOKBACK` (default `2000`)
- `VITE_SUPABASE_FILTER_CODES` (comma-separated allowlist)
- `VITE_PRERENDER_LIMIT` (default `200`)
- `VITE_PRERENDER_PORT` (default `4173`)

## Backend Environment Variables (`apps/api-go`)

### Required
- `DATABASE_URL`
  - Required at startup.
  - API runtime uses pgx simple protocol for query execution, so Supabase/PgBouncer transaction pooler endpoints are supported without extra URL flags.

### CORS
- `FRONTEND_ORIGIN`
  - Default: `*`
  - Example for local dev: `http://localhost:5173`

### Server
- `API_ADDRESS` (default `:8080`)
- `API_READ_TIMEOUT` (default `10s`)
- `API_WRITE_TIMEOUT` (default `15s`)
- `API_IDLE_TIMEOUT` (default `60s`)
- `API_MAX_PAGE_SIZE` (default `200`, minimum enforced `10`)

### Redis (optional)
- `REDIS_ADDR`
- `REDIS_PASSWORD`
- `REDIS_DB` (default `0`)
  - If Redis is unset/unavailable, service continues without cache hits.

## Source Files
- Frontend env usage: `src/services/productService.ts`, `scripts/generate-sitemap.mjs`, `scripts/prerender.mjs`
- Backend env loading: `apps/api-go/internal/config/config.go`
