# Frontend Runtime

## Routing
- Home search page: `/`
- SEO landing pages: `/levne-deskovky`, `/deskove-hry`
- Product detail page: `/deskove-hry/:slug`
- Unknown paths render an explicit not-found screen.

All product navigation is slug-based.

## Data Access
- Frontend runtime reads data through backend API (`VITE_API_BASE_URL`).
- Runtime does not use browser-side direct PostgREST/Supabase reads for catalog/search/detail.
- API requests retry for transient failures (HTTP 429/5xx and network errors).
- Search requests are cancelable; stale in-flight requests are aborted when query/filter changes.
- Core API usage:
  - Catalog/filter: `/api/v1/catalog`
  - Search suggestions: `/api/v1/search/suggest`
  - Product detail snapshots: `/api/v1/products/:slug`
  - Recent snapshots: `/api/v1/snapshots/recent`
  - Categories metadata: `/api/v1/meta/categories`
  - Price-range metadata: `/api/v1/meta/price-range`

## Runtime Tuning Environment Variables
- `VITE_API_SEARCH_LIMIT` (fallback: `VITE_SUPABASE_SEARCH_LIMIT`)
- `VITE_API_RECENT_LOOKBACK` (fallback: `VITE_RECENT_DISCOUNT_LOOKBACK`)
- `VITE_API_FILTER_CODES` (fallback: `VITE_SUPABASE_FILTER_CODES`)
- `VITE_API_RETRY_ATTEMPTS`
- `VITE_API_RETRY_DELAY_MS`
- `VITE_SEARCH_MAX_SERIES`

## Key UI Behaviors
- Search overlay activates on debounced input and shows suggestions.
- Filtered catalog supports availability, price range, and categories.
- Category options and price bounds are fetched from metadata endpoints, not a full in-browser catalog preload.
- Product detail renders hero/gallery, availability, outbound CTA, multi-seller history chart, and supplementary parameters panel.

## Seller Content Rule in UI
- Prefer `tlamagames`/`tlamagase` content fields where available.
- Fallback to other seller data when preferred fields are missing.
