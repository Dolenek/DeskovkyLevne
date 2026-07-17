# Configuration Reference

## Frontend Environment Variables

### Runtime API
- `VITE_API_BASE_URL`
  - Default: empty string, meaning same-origin `/api/v1`.
  - Purpose: backend API base URL used by browser runtime.
- `VITE_API_PROXY_TARGET`
  - Default: `VITE_API_BASE_URL`, then `http://localhost:8080`.
  - Purpose: Vite dev-server proxy target for same-origin local `/api/*`
    requests.

### Recommended for production SEO
- `VITE_SITE_URL`
  - Default: `https://www.deskovkylevne.com`
  - Purpose: absolute canonical, Open Graph, and JSON-LD URL generation. The
    prerender pass rewrites its local origin to this value before writing HTML.

### Optional for dynamic build-time sitemap/prerender
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build scripts also read:
- `SUPABASE_URL`
- `DATABASE_URL`

Build-time DB access still requires `VITE_SUPABASE_ANON_KEY`; if missing,
scripts switch to static-only output. With credentials, build scripts read
`catalog_slug_state` for sitemap/product pages and `catalog_slug_seller_state`
for product preview prices, offers, and fallback images.

### Optional frontend runtime tuning
- `VITE_API_SEARCH_LIMIT` (fallback: `VITE_SUPABASE_SEARCH_LIMIT`, default `60`)
- `VITE_API_PRODUCT_HISTORY_POINTS` (default `0`, disabled; max enforced by backend `5000`)
- `VITE_API_FILTER_CODES` (fallback: `VITE_SUPABASE_FILTER_CODES`,
  comma-separated allowlist sent to API as `product_codes`; maximum 200
  values and 120 characters per value)
- `VITE_API_RETRY_ATTEMPTS` (default `2`)
- `VITE_API_RETRY_DELAY_MS` (default `250`)
- `VITE_SEARCH_MAX_SERIES` (default `60`)
- `VITE_PRERENDER_PORT` (default `4173`)

Missing and blank numeric frontend variables use their documented defaults. A
literal `0` remains an explicit value where the setting permits zero.

## Backend Environment Variables (`apps/api-go`)

### Required
- `DATABASE_URL`

### CORS
- `FRONTEND_ORIGIN` (application default `http://localhost:5173`; required and
  non-empty in the production compose stack)

### Read Model Source
- `API_CATALOG_SUMMARY_RELATION` (default `public.catalog_slug_state`)
  - Optional relation override for catalog/search/meta queries.
  - Use legacy `public.catalog_slug_summary` only as an operational fallback and only if it has the columns required by current filters.

### Server
- `API_ADDRESS` (default `:8080`)
- `API_READ_HEADER_TIMEOUT` (default `5s`)
- `API_READ_TIMEOUT` (default `10s`)
- `API_WRITE_TIMEOUT` (default `15s`)
- `API_IDLE_TIMEOUT` (default `60s`)
- `API_MAX_HEADER_BYTES` (default `32768`, minimum enforced `8192`)
- `API_TRUSTED_PROXY_CIDRS` (default empty; comma-separated CIDRs whose direct
  connections may supply `CF-Connecting-IP` or `X-Forwarded-For`)
- `API_MAX_PAGE_SIZE` (default `200`, minimum enforced `10`)

### Go Runtime and Container Limits
- `API_GO_MEMORY_LIMIT` (compose default `768m`)
- `GOMEMLIMIT` (compose default `384MiB`)
- `GOGC` (compose default `50`)

### DB Pool
- `API_DATABASE_ROLE` (default `tlamasite_api`; safely applied with `SET ROLE`
  after every successful connection)
- `API_DB_MAX_CONNS` (compose default `10`; application default `30`)
- `API_DB_MIN_CONNS` (compose default `1`; application default `5`)
- `API_DB_MAX_CONN_IDLE` (default `5m`)
- `API_DB_MAX_CONN_LIFETIME` (default `2h`)
- `API_DB_SIMPLE_PROTOCOL` (default `true`)

### Route Timeouts
- `API_TIMEOUT_HEALTH` (default `2s`)
- `API_TIMEOUT_READY` (default `2s`)
- `API_TIMEOUT_CATALOG` (default `6s`)
- `API_TIMEOUT_SEARCH` (default `3s`)
- `API_TIMEOUT_PRODUCT` (default `6s`)
- `API_TIMEOUT_DISCOUNTS` (default `4s`)
- `API_TIMEOUT_METADATA` (default `4s`)
- `API_TIMEOUT_PRICE_RANGE` (default `4s`)

### Redis (optional)
- `REDIS_ADDR`
- `REDIS_PASSWORD`
- `REDIS_DB` (default `0`)

The production compose stack requires a non-empty `REDIS_PASSWORD`, enables
Redis authentication, and starts `api-go` only after the authenticated Redis
healthcheck passes. A standalone API can omit `REDIS_ADDR`; cache-backed
endpoints then continue to work directly against PostgreSQL.

### API Cache Controls
- `API_CACHE_NAMESPACE` (default `api-v2`)
- `API_CACHE_TTL_CATALOG` (default `120s`)
- `API_CACHE_TTL_SEARCH` (default `60s`)
- `API_CACHE_TTL_PRODUCT` (default `300s`)
- `API_CACHE_TTL_DISCOUNTS` (default `60s`)
- `API_CACHE_TTL_PRICE_RANGE` (default `180s`)

## Source Files
- Frontend env usage: `src/services/api/config.ts`, `scripts/generate-sitemap.mjs`, `scripts/prerender.mjs`
- Backend env loading: `apps/api-go/internal/config/config.go`
