# Architecture Overview

## System Components
- Frontend SPA: React + Vite + TypeScript (`src/`).
- Backend read API: Go service (`apps/api-go`) exposing `/api/v1/*`.
- Database: Postgres/Supabase as source of truth.
- Optional cache: Redis for API read-path caching.

## Read Models
- `catalog_slug_summary`: one row per canonical slug for catalog/search/filter.
- `catalog_slug_seller_summary`: one row per `slug + seller`, includes per-seller history points.
- Phase-2 optional incremental tables:
  - `catalog_slug_state`
  - `catalog_slug_seller_state`

## Runtime Data Flow
1. Browser requests catalog/search/detail data from Go API.
2. API reads Postgres materialized views and snapshot table.
3. API applies route-level request deadlines and DB context cancellation.
4. API optionally serves cached responses from Redis with singleflight cache-miss coalescing, cache-hit/miss logging, and a configurable cache namespace.
5. Frontend renders slug-keyed pages, explicit not-found routes, and multi-seller history.

## Build-Time Data Flow
1. `scripts/generate-sitemap.mjs` generates `public/sitemap.xml`.
2. `vite build` creates SPA assets.
3. `scripts/prerender.mjs` prerenders static HTML into `dist/`.

Build-time slug source is `catalog_slug_summary`. If Supabase credentials are missing, build-time scripts fall back to static routes only.

## Design Decisions
- Slug-first routing and data identity (`product_name_normalized`).
- Multi-seller history remains parallel, never merged into one synthetic series.
- Seller-priority content selection: prefer `tlamagames`/`tlamagase`, then fallback.
- Go API is the canonical runtime read interface; direct client reads from raw snapshot tables are operationally deprecated and gated by explicit cutover SQL.
- Product detail history can be bounded with `history_points` without changing slug identity semantics.
- Catalog/search/meta read relation can be switched with `API_CATALOG_SUMMARY_RELATION` for incremental-state cutover.
