# Product Domain Model

## Canonical Identifier
- Canonical product identity is `product_name_normalized` (slug).
- Routes, links, and detail lookups must use slug only (`/deskove-hry/:slug`).
- `product_code` is not a routing identifier.

## Seller Granularity
- Snapshot and history data must be preserved per seller.
- Price history visualization must show all available sellers in parallel.
- No seller history merging into a single synthetic line.

## Presentation Priority Rule
- For hero image, description, and similar display text:
  1. Prefer `tlamagames` and `tlamagase`
  2. Fallback to another seller only when preferred data is missing

## Search and Filtering Semantics
- Catalog and suggestion search are slug-centered but can match name and code.
- Suggestion responses may use a reduced field projection, but slug/name/code/price/image semantics stay unchanged.
- Category filtering uses extracted category tags from supplementary parameters.
- Availability filters:
  - `available` maps to in-stock signal
  - `preorder` maps to pre-order signal

## Read-Model Expectations
- `catalog_slug_summary` must remain one row per slug.
- `catalog_slug_seller_summary` must remain one row per `slug + seller`.
- Any schema or query change must preserve these invariants.
