# Product Domain Model

## Canonical Identifier
- Canonical product identity is `product_name_normalized` (slug).
- Routes, links, and detail lookups must use slug only (`/deskove-hry/:slug`).
- `product_code` is not a routing identifier.
- Scraped slugs can resolve through `canonical_product_aliases` when a product
  has been reviewed as the same item across sellers, renamed pages, or duplicate
  seller slugs.
- Alias resolution never rewrites raw snapshots. It changes only read models and
  API lookup behavior.
- `canonical_product_alias_candidates` is a review queue only. Candidate rows do
  not affect public catalog/search/detail responses.

## Seller Granularity
- Snapshot and history data must be preserved per seller.
- Price history visualization must show all available sellers in parallel.
- Product detail history points represent seller-day checks from daily history,
  including days where price did not change.
- No seller history merging into a single synthetic line.
- History bounding controls (for example API `history_points`) apply per seller
  so one seller cannot displace another, and must never merge sellers.
- Seller-offer presentation must not invent values that are not in the read
  model. Shipping prices, shop ratings, and price-watch state require explicit
  backend data before they can appear as factual UI fields.

## Presentation Priority Rule
- For hero image, description, and similar display text:
  1. Prefer `tlamagames` and `tlamagase`
  2. Fallback to another seller only when preferred data is missing
- Catalog presentation fallback is applied independently per field, so one
  missing TLAMA value does not suppress usable content from another seller.

## Search and Filtering Semantics
- Catalog and suggestion search are slug-centered but can match name and code.
- For canonical products with approved aliases, search text includes seller
  names/codes plus alias slugs/codes so old naming variants can find the
  canonical product.
- Search treats punctuation and other special characters as token separators.
  All tokens in a multi-word query must match in any order.
- Suggestion responses may use a reduced field projection, but slug/name/code/price/image/category-tag semantics stay unchanged.
- Category filtering uses normalized tag arrays from supplementary parameters: `category_tags`, `genre_tags`, `game_type_tags`, and `mechanic_tags`.
- Filter metadata and price bounds are served through API metadata endpoints, not from full client-side catalog scans.
- Supported catalog filter dimensions are price, availability, sale state, category tags, player count, playtime, and minimum age.
- Discount filtering includes products where `price_movement = decreased` or `latest_price < list_price_with_vat`.
- Availability filters:
  - `available` maps to in-stock signal
  - `preorder` maps to pre-order signal

## Read-Model Expectations
- Runtime catalog/search/filter queries read `catalog_slug_state`, one row per
  canonical slug.
- `catalog_slug_seller_state` remains one row per `canonical slug + seller` and is available for per-seller read-model expansion.
- Product detail history reads `catalog_daily_price_history` for chart points
  and joins seller metadata from `catalog_slug_seller_state`.
- Product detail accepts canonical slugs and approved alias slugs. Responses use
  the canonical slug in `product_name_normalized`.
- Product detail transports seller metadata once and nests that seller's compact
  daily history underneath it. An unknown canonical or alias slug returns 404.
- Seller-level `latest_price`, `previous_price`, `first_price`, and current
  list price remain authoritative even when chart history is bounded.
- Recent discounts are seller-level projections from `catalog_slug_seller_state`;
  reference and current prices must belong to the same seller.
- Legacy materialized views `catalog_slug_summary` and `catalog_slug_seller_summary` may exist, but they are not the default runtime catalog source.
- Any schema or query change must preserve these invariants.
