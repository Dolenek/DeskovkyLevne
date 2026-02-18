# Architecture Overview

## System Components
- Frontend SPA: React + Vite + TypeScript (`src/`).
- Backend read API: Go service (`apps/api-go`) exposing `/api/v1/*`.
- Database: Postgres/Supabase as source of truth.
- Optional cache: Redis for API read-path caching.

## Read Models
- `catalog_slug_summary`: one row per canonical slug for catalog/search/filter.
- `catalog_slug_seller_summary`: one row per `slug + seller`, includes per-seller history points.

## Runtime Data Flow
1. Browser requests catalog/search/detail data from Go API.
2. API reads Postgres materialized views (and raw snapshots where needed).
3. API optionally serves cached responses from Redis.
4. Frontend renders slug-keyed pages and multi-seller history.

## Build-Time Data Flow
1. `scripts/generate-sitemap.mjs` generates `public/sitemap.xml`.
2. `vite build` creates SPA assets.
3. `scripts/prerender.mjs` prerenders static HTML into `dist/`.

Build-time slug source is `catalog_slug_summary`. If Supabase credentials are missing, build-time scripts fall back to static routes only.

## Design Decisions
- Slug-first routing and data identity (`product_name_normalized`).
- Multi-seller history remains parallel, never merged into one synthetic series.
- Seller-priority content selection: prefer `tlamagames`/`tlamagase`, then fallback.
