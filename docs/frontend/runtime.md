# Frontend Runtime

## Routing
- Home landing page: `/`
- Legacy landing alias: `/levne-deskovky` with canonical SEO pointing to `/`
- Catalog page: `/deskove-hry`
- Product detail page: `/deskove-hry/:slug`
- Unknown paths render an explicit not-found screen.

All product navigation is slug-based.

## Data Access
- Frontend runtime reads data through backend API (`VITE_API_BASE_URL`).
- `npm run dev` starts the local Go API and Vite frontend together. Local Vite
  development uses same-origin `/api/*` requests and proxies them with
  `VITE_API_PROXY_TARGET`, defaulting to `http://localhost:8080`.
- Runtime does not use browser-side direct PostgREST/Supabase reads for catalog/search/detail.
- Runtime API calls are organized through shared client/config modules (`src/services/api/*`).
- API requests retry for transient failures (HTTP 429/5xx and network errors).
- Search requests are cancelable; stale in-flight requests are aborted when query/filter changes.
- Core API usage:
  - Catalog/filter: `/api/v1/catalog`
  - Search suggestions: `/api/v1/search/suggest`
  - Product detail snapshots: `/api/v1/products/:slug`
  - Recent snapshots: `/api/v1/snapshots/recent`
  - Categories metadata: `/api/v1/meta/categories`
  - Filter options metadata: `/api/v1/meta/filter-options`
  - Price-range metadata: `/api/v1/meta/price-range`

## Runtime Tuning Environment Variables
- `VITE_API_SEARCH_LIMIT` (fallback: `VITE_SUPABASE_SEARCH_LIMIT`)
- `VITE_API_RECENT_LOOKBACK` (fallback: `VITE_RECENT_DISCOUNT_LOOKBACK`)
- `VITE_API_PRODUCT_HISTORY_POINTS`
- `VITE_API_FILTER_CODES` (fallback: `VITE_SUPABASE_FILTER_CODES`)
- `VITE_API_RETRY_ATTEMPTS`
- `VITE_API_RETRY_DELAY_MS`
- `VITE_SEARCH_MAX_SERIES`

## Key UI Behaviors
- Frontend uses a light DeskovkyLevně brand system: navy text, white surfaces,
  green primary CTAs, orange promotional CTAs, subtle borders, and shared
  header/footer/CTA components.
- Shared UI iconography uses `lucide-react` through the local `Icon`
  component so feature components do not import icon packages directly.
- Shared presentation components use static generated board-game scene assets
  for catalog decorative artwork and product-detail CTA artwork. Landing hero,
  product cards, and product galleries are API-image driven.
- Search overlay activates on debounced input and shows suggestions.
- Catalog renders a search/filter toolbar, category chips, sticky desktop
  filter sidebar, mobile filter drawer, active filter chips, product card grid,
  and pagination controls.
- Landing pages render a search hero with one random available product on each
  visit, live catalog metrics, and random available product cards from one
  seed-ordered catalog request.
- Filtered catalog sends price range, availability, discounted state, player-count buckets, playtime buckets, age buckets, and canonical category slugs to the API for server-side filtering.
- Filter options and price bounds are fetched from metadata endpoints, not a full in-browser catalog preload.
- Product detail renders gallery, hero price summary, quick summary,
  seller-offer table, price stats, multi-seller history chart, supplementary
  parameters, related games, and CTA banner.

## Seller Content Rule in UI
- Prefer `tlamagames`/`tlamagase` content fields where available.
- Fallback to other seller data when preferred fields are missing.
