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

### Optional frontend runtime tuning
- `VITE_API_SEARCH_LIMIT` (fallback: `VITE_SUPABASE_SEARCH_LIMIT`, default `60`)
- `VITE_API_RECENT_LOOKBACK` (fallback: `VITE_RECENT_DISCOUNT_LOOKBACK`, default `2000`)
- `VITE_RECENT_DISCOUNT_RESULTS` (default `10`)
- `VITE_API_FILTER_CODES` (fallback: `VITE_SUPABASE_FILTER_CODES`, comma-separated allowlist)
- `VITE_API_INITIAL_CHUNK` (fallback: `VITE_SUPABASE_INITIAL_CHUNK`, default `400`)
- `VITE_API_CATALOG_CHUNK` (fallback: `VITE_SUPABASE_CATALOG_CHUNK`, default `2000`)
- `VITE_API_CATALOG_PREFETCH_DELAY` (fallback: `VITE_SUPABASE_CATALOG_PREFETCH_DELAY`, default `150`)
- `VITE_PRERENDER_LIMIT` (default `200`)
- `VITE_PRERENDER_PORT` (default `4173`)

## Backend Environment Variables (`apps/api-go`)

### Required
- `DATABASE_URL`

### CORS
- `FRONTEND_ORIGIN` (default `*`)

### Server
- `API_ADDRESS` (default `:8080`)
- `API_READ_TIMEOUT` (default `10s`)
- `API_WRITE_TIMEOUT` (default `15s`)
- `API_IDLE_TIMEOUT` (default `60s`)
- `API_MAX_PAGE_SIZE` (default `200`, minimum enforced `10`)

### DB Pool
- `API_DB_MAX_CONNS` (default `30`)
- `API_DB_MIN_CONNS` (default `5`)
- `API_DB_MAX_CONN_IDLE` (default `5m`)
- `API_DB_MAX_CONN_LIFETIME` (default `2h`)
- `API_DB_SIMPLE_PROTOCOL` (default `true`)

### Route Timeouts
- `API_TIMEOUT_HEALTH` (default `2s`)
- `API_TIMEOUT_CATALOG` (default `6s`)
- `API_TIMEOUT_SEARCH` (default `3s`)
- `API_TIMEOUT_PRODUCT` (default `6s`)
- `API_TIMEOUT_RECENT` (default `12s`)
- `API_TIMEOUT_CATEGORIES` (default `4s`)

### Redis (optional)
- `REDIS_ADDR`
- `REDIS_PASSWORD`
- `REDIS_DB` (default `0`)

## Source Files
- Frontend env usage: `src/services/productService.ts`, `src/hooks/useChunkedProductCatalog.ts`, `scripts/generate-sitemap.mjs`, `scripts/prerender.mjs`
- Backend env loading: `apps/api-go/internal/config/config.go`
