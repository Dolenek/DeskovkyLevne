# Architecture Overview

## System Components
- Frontend SPA: React + Vite + TypeScript (`src/`).
- Backend read API: Go service (`apps/api-go`) exposing `/api/v1/*`.
- Database: Postgres/Supabase as source of truth.
- Optional cache: Redis for API read-path caching.

## Read Models
- `catalog_slug_state`: default runtime catalog/search/filter source, one row per canonical slug.
- `catalog_slug_seller_state`: one row per `slug + seller`, includes per-seller history points and seller-level facts.
- `catalog_daily_price_history`: seller-day price checks used by product detail
  history charts.
- `canonical_products` and `canonical_product_aliases`: reviewed product identity
  overrides used to resolve known cross-seller or renamed duplicate slugs.
- `canonical_product_alias_candidates`: review queue for suggested aliases; rows
  here do not affect runtime identity until approved into `canonical_product_aliases`.
- Legacy materialized views `catalog_slug_summary` and `catalog_slug_seller_summary` can remain available for operational fallback but are not the default API source.

## Runtime Data Flow
1. Browser requests catalog/search/detail data from Go API.
2. API resolves product aliases with `canonical_product_slug(...)` and reads
   Postgres state tables and seller-day history. Runtime endpoints do not expose
   raw snapshot rows.
3. API applies route-level request deadlines and DB context cancellation.
4. API optionally serves cached responses from Redis with cancellation-safe
   singleflight cache-miss coalescing, cache diagnostics, and a versioned cache
   namespace.
5. Product detail responses nest compact history below seller metadata; the
   frontend expands this transport shape into independent seller chart series.
6. Recent discounts come from seller-level state and never compare prices
   between sellers.

## Build-Time Data Flow
1. `scripts/generate-sitemap.mjs` generates `public/sitemap.xml`.
2. `vite build` creates SPA assets.
3. `scripts/prerender.mjs` prerenders static HTML into `dist/`.

Build-time slug source is `catalog_slug_state`. If Supabase credentials are missing, build-time scripts fall back to static routes only.

## Design Decisions
- Slug-first routing and data identity (`product_name_normalized`).
- Approved aliases can map scraped slugs and seller-specific product codes to a
  reviewed canonical slug; raw snapshots are not rewritten.
- Multi-seller history remains parallel, never merged into one synthetic series.
- Seller-priority content selection: prefer `tlamagames`/`tlamagase`, then fallback.
- A read-model trigger enforces presentation priority independently for names,
  hero images, galleries, descriptions, and supplementary parameters.
- Canonical slug resolution only attempts seller/code matching when both keys
  are present; slug-only lookups use the alias slug index directly.
- Go API is the canonical runtime read interface; direct client reads from raw snapshot tables are operationally deprecated and gated by explicit cutover SQL.
- Product detail history uses seller-day checks and `history_points` bounds each
  seller independently without changing slug identity semantics.
- Catalog/search/meta read relation defaults to `public.catalog_slug_state` and can be switched with `API_CATALOG_SUMMARY_RELATION` for operational fallback.
- Alias candidates are generated from conservative evidence such as same
  seller/product-code duplicate slugs and small shared-EAN groups, but candidates
  require review before public catalog identity changes.
- `/health` is process liveness, `/ready` checks PostgreSQL, and `/version`
  identifies the deployed build.
