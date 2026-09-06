# Frontend Runtime

## Routing
- Home landing page: `/`
- Legacy landing alias: `/levne-deskovky` with canonical SEO pointing to `/`
- Catalog page: `/deskove-hry`
- Search results: `/deskove-hry?q=encoded-query`; opening a link, refreshing,
  and browser Back/Forward restore the submitted query, filters, sort, and page.
  Catalog changes replace the current history entry; a new search starts a new
  entry. Browser history stores the scroll position and restores it after results
  load. Invalid URL selections are normalized to supported values.
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
  - Filter options metadata: `/api/v1/meta/filter-options`
  - Price-range metadata: `/api/v1/meta/price-range`

## Runtime Tuning Environment Variables
- `VITE_API_SEARCH_LIMIT` (fallback: `VITE_SUPABASE_SEARCH_LIMIT`)
- `VITE_API_PRODUCT_HISTORY_POINTS`
- `VITE_API_FILTER_CODES` (fallback: `VITE_SUPABASE_FILTER_CODES`)
- `VITE_API_RETRY_ATTEMPTS`
- `VITE_API_RETRY_DELAY_MS`
- `VITE_SEARCH_MAX_SERIES`

## Key UI Behaviors
- Frontend uses a light DeskovkyLevně brand system: navy text, white surfaces,
  green primary CTAs, orange promotional CTAs, subtle borders, and shared
  header/footer components.
- Shared UI iconography uses `lucide-react` through the local `Icon`
  component so feature components do not import icon packages directly.
- Mock fallback catalog and product-detail rows use static board-game scene
  assets. Production landing hero, product cards, and product galleries are
  API-image driven.
- API-backed catalog, search overlay, landing product blocks, and product
  detail use skeleton loading states. Product images keep a skeleton placeholder
  until each image load either succeeds or fails.
- The desktop header uses a three-zone layout with centered search. Search
  overlay activates on debounced input and shows suggestions.
- The `/` key focuses the header search from non-editable page content. While
  suggestions are open, arrow keys move the highlighted suggestion and
  `Escape` closes the overlay without clearing the query. Enter in any search
  field always submits the current text, including after arrow navigation.
  Clicking a suggestion opens its product detail. Other buttons retain native
  keyboard activation.
- Selecting a search suggestion from a product detail immediately invalidates
  data loaded for the previous slug, so stale product data cannot restore the
  previous product route while the new request is loading.
- Search overlay keeps a larger deduplicated suggestion candidate pool, ranks
  available products before unavailable or unknown-availability products, and
  dynamically renders the number of rows that fit in the viewport minus one.
- Frontend search strips diacritics, treats punctuation and special characters
  as spaces, lowercases the query, and sends a compact token string to the API.
- Catalog has one search field in the shared header, a sort selector, horizontally
  scrollable mobile category chips, a sticky desktop filter sidebar, and a mobile
  filter drawer. Only mobile displays the drawer button. The drawer locks body
  scrolling, traps focus, closes with Escape, restores trigger focus, and has a
  fixed results button displaying the current count when loaded.
- Active filter chips remove individual filters. Clearing filters preserves the
  query and sort. Pagination uses a moving five-page window and scrolls to the
  new results; there is no separate load-more control.
- Catalog sorting uses API `sort=name|price_asc|price_desc` across the whole result
  set before pagination. Missing prices sort last in both price directions.
- Header and landing hero search forms submit with Enter or their
  search button. Typing only updates suggestions; the grid uses the submitted
  query. Submission does not wait for the suggestion debounce.
- Each submission resets filters and pagination, even for the same query.
  Catalog starts without price bounds. Applying or resetting filters and
  changing pages preserves the submitted query.
- Search results use `/api/v1/catalog?q=...`, its exact total, selected server-side
  ordering with stable name/slug tie-breaks, and ten items per page. They are not limited to suggestion candidates.
  The heading displays the submitted query; no matches show a query-specific
  empty state. Active filters can be reset from an empty result.
- Search fields and URL queries are capped at 120 characters. The URL and
  heading preserve the trimmed text; API queries use the existing normalization.
  Empty or punctuation-only submissions open the unfiltered catalog.
- Suggestion panels appear below the active search form so it remains usable
  on desktop and mobile.
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
- Unqueried catalog and search overlay render one mock product when API requests cannot
  be reached because the browser reports `Failed to fetch` or the API/proxy
  returns a transient 5xx failure. Text-search catalog failures instead display
  an error with retry and never insert an unrelated mock result.
- Product detail renders a two-column desktop hero with a wider gallery and
  narrower text/price column. On mobile the name, gameplay parameters, price,
  and offer CTA precede the compact gallery. Offers precede the history chart
  and price statistics. The multi-seller history chart has range controls,
  interactive seller visibility, a portal-rendered tooltip, and a zoomed price axis
  based on visible values. Supplementary parameters and a price-freshness summary
  follow the chart and statistics.
- Product detail chart points prefer API `price_date` and fall back to
  `scraped_at` for raw snapshot-shaped rows.
- Product detail expands the compact seller-nested API response for the existing
  product-series builder. API 404 responses render the not-found state.
- Product detail keeps seller-level current/previous/first/list prices from the
  API authoritative while using daily history only for chart points. An
  explicit missing current price is never replaced by history; history is used
  as a compatibility fallback only when the legacy snapshot shape omits the
  current-price field entirely.
- Seller metadata and current offers remain available even when a seller has
  no usable chart points. A known product without prices still renders its
  detail page; absence of price history does not imply that the product is
  missing. Zero is a valid current offer, while a missing price is omitted
  from the offers table. Missing history dates do not create chart points.
- Date-only history values are formatted as calendar dates without timezone
  conversion.
- Product detail renders one mock product with multi-seller price history when
  the product API cannot be reached because the browser reports `Failed to fetch`
  or the API/proxy returns a transient 5xx failure.
- Product detail offer CTA scrolls to the seller-offer section. Price-watch and
  favorite actions are not rendered until backend support exists.
- Seller-offer rows show seller, price, normalized availability, source check date,
  and an outbound shop link. Prices explicitly exclude shipping; shipping charges
  and ratings are not simulated. The first eight offers are shown initially,
  with an expandable control for all remaining offers.
- Confirmed in-stock offers come first, followed by other offers; both groups are
  ordered by current price. All offers tied for the lowest in-stock price are
  highlighted. The hero prefers this price; when no stock is confirmed it labels
  the lowest listed price and explicitly states that stock is not confirmed.
  SEO describes the lowest listed price across sellers. Missing prices are excluded
  from offers but remain available as chart series; an empty table has an explicit
  message and the hero omits its offer CTA.
- History charts fit the viewport, including on mobile, with adaptive date ticks
  and a compact two-column seller legend below the graph. All sellers start visible.
- Product breadcrumbs are links. Gameplay parameters (players, playtime, minimum
  age, language) appear near the title when supplied by the preferred seller.
  Other parameters remain accessible through an expandable section. The freshness
  panel reports seller coverage and the latest check of any offer, while each
  offer retains its own check date.
- Whole currency amounts omit zero decimal places. Product cards use locale-aware
  shop-count plurals, contained images, and unbroken discount badges. Suggestions
  show source category labels instead of unexplained seller product codes.
- Catalog navigation and language selection remain available on mobile and tablet.
  Landing statistics show the API-backed tracked count and descriptive comparison/
  history labels; no fixed shop count or daily refresh percentage is claimed.
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
