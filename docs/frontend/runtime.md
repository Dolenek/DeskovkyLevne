# Frontend Runtime

## Routing
- Home search page: `/`
- SEO landing pages: `/levne-deskovky`, `/deskove-hry`
- Product detail page: `/deskove-hry/:slug`

All product navigation is slug-based.

## Data Access
- Frontend runtime reads data through backend API (`VITE_API_BASE_URL`).
- Runtime does not use browser-side direct PostgREST/Supabase reads for catalog/search/detail.
- API requests automatically retry for transient failures (HTTP 429/5xx and network errors) before surfacing errors in UI.
- Core API usage:
  - Catalog/filter: `/api/v1/catalog`
  - Search suggestions: `/api/v1/search/suggest`
  - Product detail snapshots: `/api/v1/products/:slug`
  - Recent snapshots: `/api/v1/snapshots/recent`
  - Categories: `/api/v1/meta/categories`

## Runtime Tuning Environment Variables
- `VITE_API_SEARCH_LIMIT` (fallback: `VITE_SUPABASE_SEARCH_LIMIT`)
- `VITE_API_RECENT_LOOKBACK` (fallback: `VITE_RECENT_DISCOUNT_LOOKBACK`)
- `VITE_API_FILTER_CODES` (fallback: `VITE_SUPABASE_FILTER_CODES`)
- `VITE_API_INITIAL_CHUNK` (fallback: `VITE_SUPABASE_INITIAL_CHUNK`)
- `VITE_API_CATALOG_CHUNK` (fallback: `VITE_SUPABASE_CATALOG_CHUNK`)
- `VITE_API_CATALOG_PREFETCH_DELAY` (fallback: `VITE_SUPABASE_CATALOG_PREFETCH_DELAY`)

## Key UI Behaviors
- Search overlay activates on debounced input and shows suggestions.
- Filtered catalog supports availability, price range, and categories.
- Product detail renders hero/gallery, availability, outbound CTA, multi-seller history chart, and supplementary parameters panel.

## Seller Content Rule in UI
- Prefer `tlamagames`/`tlamagase` content fields where available.
- Fallback to other seller data when preferred fields are missing.
