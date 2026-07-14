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

## SEO Metadata
- Product detail pages use product-specific browser and social metadata:
  `{product name} | Deskovky levně` title, a comparison-focused description
  with seller count and the lowest final current price across all sellers when
  available, canonical slug URL, product `og:type`, large Twitter card, and
  Product JSON-LD.
- Product social images use the same first-image rules as the visible gallery:
  prefer the hero image, then gallery images, normalize `/related/` image URLs
  to `/big/`, deduplicate, and skip placeholder or thumbnail-only assets such
  as `blank.gif` and `150x150` images.
- Production prerender writes product-specific metadata into static HTML files
  under `/deskove-hry/:slug` for all catalog slugs when build-time data
  credentials are available. Crawlers that do not execute JavaScript receive
  product metadata instead of landing-page fallback metadata.

## Data Access
- Frontend runtime reads data through backend API (`VITE_API_BASE_URL`).
- `npm run dev` starts the local Go API and Vite frontend together. Local Vite
  development uses same-origin `/api/*` requests and proxies them with
  `VITE_API_PROXY_TARGET`, defaulting to `http://localhost:8080`.
- Runtime does not use browser-side direct PostgREST/Supabase reads for catalog/search/detail.
- Runtime API calls are organized through shared client/config modules (`src/services/api/*`).
- API requests retry for transient failures (HTTP 429/5xx and network errors).
- Search requests are cancelable; stale in-flight requests are aborted when query/filter changes.
- Product detail requests use the same stale-response protection; changing the
  slug clears the previous product before canonical URL reconciliation.
- Core API usage:
  - Catalog/filter: `/api/v1/catalog`
  - Search suggestions: `/api/v1/search/suggest`
  - Compact product detail and seller-day history: `/api/v1/products/:slug`
  - Seller-aware recent discounts: `/api/v1/discounts/recent`
  - Filter options metadata: `/api/v1/meta/filter-options`
  - Price-range metadata: `/api/v1/meta/price-range`

## Runtime Tuning Environment Variables
- `VITE_API_SEARCH_LIMIT` (fallback: `VITE_SUPABASE_SEARCH_LIMIT`)
- `VITE_API_RECENT_DISCOUNT_LIMIT` (default `10`, capped at `100`)
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
- The `/` key focuses the header search from non-editable page content. While
  suggestions are open, arrow keys move the highlighted suggestion, `Enter`
  opens it, and `Escape` closes the overlay without clearing the query.
- Selecting a search suggestion from a product detail immediately invalidates
  data loaded for the previous slug, so stale product data cannot restore the
  previous product route while the new request is loading.
- Search overlay keeps a larger deduplicated suggestion candidate pool, ranks
  available products before unavailable or unknown-availability products, and
  dynamically renders the number of rows that fit in the viewport minus one.
- Frontend search strips diacritics, treats punctuation and special characters
  as spaces, lowercases the query, and sends a compact token string to the API.
- Catalog renders a search/filter toolbar, category chips, sticky desktop
  filter sidebar, mobile filter drawer, active filter chips, product card grid,
  and pagination controls.
- Catalog cards use backend `seller_count` and do not render ratings,
  review counts, or favorite controls without backend data.
- Locale switching affects static UI labels, number/date formatting, normalized
  availability labels, and frontend-owned filter labels. Catalog data text from
  the API, including product names, category tags, seller names, supplementary
  parameters, and `short_description`, is rendered as source data and is not
  translated in the browser.
- Landing pages render a search hero with one random available product on each
  visit and random available product cards from one seed-ordered catalog
  request. The tracked-games metric reads `/api/v1/catalog/overview` and shows
  the total canonical slug count. The available subset remains API-only and is
  not displayed on the landing page.
- Filtered catalog sends price range, availability, discounted state, player-count buckets, playtime buckets, age buckets, and canonical category slugs to the API for server-side filtering.
- Manual price bounds are normalized to non-negative values before API calls.
  Reversed bounds are ordered from lower to higher, and the normalized values
  are written back to both inputs when either input loses focus.
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
- Product detail expands the compact seller-nested API response for the existing
  product-series builder. API 404 responses render the not-found state.
- Product detail keeps seller-level current/previous/first/list prices from the
  API authoritative while using daily history only for chart points. An
  explicit missing current price is never replaced by history; history is used
  as a compatibility fallback only when the legacy snapshot shape omits the
  current-price field entirely.
- Date-only history values are formatted as calendar dates without timezone
  conversion.
- Recent discounts are already paired per seller by the API; the browser does
  not infer price changes from adjacent global snapshots.
- Product detail renders one mock product with multi-seller price history when
  the product API cannot be reached because the browser reports `Failed to fetch`
  or the API/proxy returns a transient 5xx failure.
- Product detail offer CTA scrolls to the seller-offer section. Price-watch and
  favorite actions are not rendered until backend support exists.
- Seller-offer rows show only API-backed values: seller, price, normalized
  availability, and outbound shop link. Shipping prices and seller ratings are
  not simulated in the frontend.
- The detail hero, SEO description, and offer ordering use the lowest current
  seller price. Sellers without a current price are excluded from current
  offers but remain available as history-chart series.
- Product galleries deduplicate normalized image URLs and skip placeholder or
  thumbnail-only images such as `blank.gif` and `150x150` assets.
- Catalog URLs are untrusted input. Seller links are rendered only for absolute,
  credential-free HTTPS URLs. Images are accepted only from HTTPS URLs or local
  absolute paths. The same rules apply to visible UI, JSON-LD, social metadata,
  and build-time product previews.

## Seller Content Rule in UI
- Prefer `tlamagames`/`tlamagase` names, images, descriptions, and other
  presentation fields where available. This priority does not affect current
  price selection or offer ordering.
- Fallback to other seller data when preferred fields are missing.
- Availability labels are presentation-normalized in the frontend when source
  data contains schema.org values or simple encoded entities.
