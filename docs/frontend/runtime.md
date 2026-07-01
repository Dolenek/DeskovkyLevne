# Frontend Runtime

## Routing
- Home landing page: `/`
- Legacy landing alias: `/levne-deskovky` with canonical SEO pointing to `/`
- Catalog page: `/deskove-hry`
- Product detail page: `/deskove-hry/:slug`
- Unknown paths render an explicit not-found screen.

All product navigation is slug-based. Product detail can be opened through an
approved alias slug, but after data loads the page replaces the browser URL and
SEO canonical link with the resolved canonical slug.

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
  - Product detail seller-day history: `/api/v1/products/:slug`
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
- API-backed catalog, search overlay, landing product blocks, and product
  detail use skeleton loading states. Product images keep a skeleton placeholder
  until each image load either succeeds or fails.
- The desktop header uses a three-zone layout with centered search. Search
  overlay activates on debounced input and shows suggestions.
- Frontend search strips diacritics, treats punctuation and special characters
  as spaces, lowercases the query, and sends a compact token string to the API.
- Catalog renders a search/filter toolbar, category chips, sticky desktop
  filter sidebar, mobile filter drawer, active filter chips, product card grid,
  and pagination controls.
- Locale switching affects static UI labels, number/date formatting, normalized
  availability labels, and frontend-owned filter labels. Catalog data text from
  the API, including product names, category tags, seller names, supplementary
  parameters, and `short_description`, is rendered as source data and is not
  translated in the browser.
- Landing pages render a search hero with one random available product on each
  visit, live catalog metrics, and random available product cards from one
  seed-ordered catalog request.
- Filtered catalog sends price range, availability, discounted state, player-count buckets, playtime buckets, age buckets, and canonical category slugs to the API for server-side filtering.
- Filter options and price bounds are fetched from metadata endpoints, not a full in-browser catalog preload.
- Catalog and search overlay render one mock product when API requests cannot
  be reached because the browser reports `Failed to fetch` or the API/proxy
  returns a transient 5xx failure.
- Product detail renders an image-led two-column hero with a wider gallery and
  narrower text/price column, followed by a seller-offer table, actual price
  statistics, a multi-seller history chart with range controls, interactive
  seller visibility, a portal-rendered tooltip, a zoomed price axis based on
  visible values, supplementary parameters, and a data summary.
- Product detail chart points prefer API `price_date` and fall back to
  `scraped_at` for raw snapshot-shaped rows.
- Product detail renders one mock product with multi-seller price history when
  the product API cannot be reached because the browser reports `Failed to fetch`
  or the API/proxy returns a transient 5xx failure.
- Product detail offer CTA scrolls to the seller-offer section. Price-watch and
  favorite actions are not rendered until backend support exists.
- Seller-offer rows show only API-backed values: seller, price, normalized
  availability, and outbound shop link. Shipping prices and seller ratings are
  not simulated in the frontend.
- Product galleries deduplicate normalized image URLs and skip placeholder or
  thumbnail-only images such as `blank.gif` and `150x150` assets.

## Seller Content Rule in UI
- Prefer `tlamagames`/`tlamagase` content fields where available.
- Fallback to other seller data when preferred fields are missing.
- Availability labels are presentation-normalized in the frontend when source
  data contains schema.org values or simple encoded entities.
