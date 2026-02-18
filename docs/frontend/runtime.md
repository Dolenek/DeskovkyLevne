# Frontend Runtime

## Routing
- Home search page: `/`
- SEO landing pages: `/levne-deskovky`, `/deskove-hry`
- Product detail page: `/deskove-hry/:slug`

All product navigation is slug-based.

## Data Access
- Frontend runtime reads data through backend API (`VITE_API_BASE_URL`).
- Runtime no longer depends on browser-side direct Supabase reads.
- API requests automatically retry for transient failures (HTTP 429/5xx and network errors) before surfacing errors in UI.
- Core API usage:
  - Catalog/filter: `/api/v1/catalog`
  - Search suggestions: `/api/v1/search/suggest`
  - Product detail snapshots: `/api/v1/products/:slug`
  - Recent snapshots: `/api/v1/snapshots/recent`
  - Categories: `/api/v1/meta/categories`

## Key UI Behaviors
- Search overlay activates on debounced input and shows suggestions.
- Filtered catalog supports availability, price range, and categories.
- Product detail renders:
  - hero + gallery
  - availability and outbound CTA
  - multi-seller history chart
  - supplementary parameters panel

## SEO Behavior
- Canonical URLs are slug-first.
- Meta tags include Open Graph and Twitter metadata.
- Structured data:
  - Home: `WebSite`
  - Product detail: `Product` with seller offer context

## Seller Content Rule in UI
- Prefer `tlamagames`/`tlamagase` content fields where available.
- Fallback to other seller data when preferred fields are missing.
