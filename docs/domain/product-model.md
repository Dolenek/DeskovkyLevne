# Product Domain Model

## Canonical Identifier
- Canonical product identity is `product_name_normalized` (slug).
- Routes, links, and detail lookups must use slug only (`/deskove-hry/:slug`).
- `product_code` is not a routing identifier.

## Seller Granularity
- Snapshot and history data must be preserved per seller.
- Price history visualization must show all available sellers in parallel.
- No seller history merging into a single synthetic line.
- History bounding controls (for example API `history_points`) may reduce returned rows but must not merge sellers.

## Presentation Priority Rule
- For hero image, description, and similar display text:
  1. Prefer `tlamagames` and `tlamagase`
  2. Fallback to another seller only when preferred data is missing

## Search and Filtering Semantics
- Catalog and suggestion search are slug-centered but can match name and code.
- Suggestion responses may use a reduced field projection, but slug/name/code/price/image/category-tag semantics stay unchanged.
- Category filtering uses extracted category tags from supplementary parameters.
- Filter metadata and price bounds are served through API metadata endpoints, not from full client-side catalog scans.
- Supported catalog filter dimensions are price, availability, sale state, category tags, player count, playtime, and minimum age.
- `price_movement = decreased` is the discounted-product signal.
- Availability filters:
  - `available` maps to in-stock signal
  - `preorder` maps to pre-order signal

## Read-Model Expectations
- Runtime catalog/search/filter queries read `catalog_slug_state`, one row per slug.
- `catalog_slug_seller_state` remains one row per `slug + seller` and is available for per-seller read-model expansion.
- Legacy materialized views `catalog_slug_summary` and `catalog_slug_seller_summary` may exist, but they are not the default runtime catalog source.
- Any schema or query change must preserve these invariants.
