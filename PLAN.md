# DB + Backend Scale Plan (Postgres-First, Go API, Self-Hosted)

## Summary
Current bottlenecks are dominated by `product_price_snapshots` scans and heavy payload reads:
- Hot query (`slug + ORDER BY scraped_at`) is doing sequential scans on ~2.08M rows, with ~89% of total DB execution time.
- `product_price_snapshots` has only a PK index today.
- `product_catalog_index` is materialized by `product_code` (not canonical slug), creating duplicate slug rows (`11,399` rows vs `11,059` distinct slugs).
- Frontend currently queries DB directly and repeatedly requests expensive `count: exact` plus large `price_points` payloads.

Chosen direction:
- Keep Postgres/Supabase host.
- Add Go backend API layer (breaking frontend change allowed).
- Add Redis now.
- Target freshness: 15–60 minutes.
- Target scale: up to ~1k concurrent users.

## Public Interfaces / Contract Changes

### New backend service
- Runtime: Go 1.23+, `chi` + `pgx` + `redis`.
- Service path prefix: `/api/v1`.

### New API endpoints
1. `GET /api/v1/catalog`
- Query params: `page`, `page_size`, `availability`, `min_price`, `max_price`, `categories`, `q`.
- Returns lightweight catalog cards only (no full history arrays).
- Response includes `total` and `total_estimate`.

2. `GET /api/v1/products/{slug}`
- Returns snapshot history for the canonical slug.
- Slug only (`product_name_normalized`) as canonical ID.

3. `GET /api/v1/search/suggest`
- Query params: `q`, `availability`, `limit`.
- Returns fast overlay suggestions.

4. `GET /api/v1/meta/categories`
- Returns normalized category list + counts.

5. `GET /api/v1/snapshots/recent`
- Query params: `limit`.
- Returns recent snapshots for discount calculations.

### Frontend contract
- Remove direct Supabase reads from browser runtime flow.
- Keep UI behavior unchanged for multi-seller graph and seller-priority content rules.

## Database Design Changes

### 1) Immediate index fixes on raw snapshots
- `idx_product_price_snapshots_slug_scraped_id` on `(product_name_normalized, scraped_at, id)`.
- `idx_product_price_snapshots_scraped_at_desc` on `(scraped_at desc)`.
- `idx_product_price_snapshots_slug_seller_scraped` on `(product_name_normalized, seller, scraped_at)`.
- Trigram support indexes for text search paths:
  - `idx_product_price_snapshots_name_trgm` on `product_name_original`.
  - `idx_product_price_snapshots_code_trgm` on `product_code`.

### 2) Slug-keyed aggregates
- `catalog_slug_seller_summary` materialized view (one row per slug+seller, includes price points).
- `catalog_slug_summary` materialized view (one row per slug, seller-priority projection for listing/search/filtering).
- Category tags extracted to `text[]` with GIN indexing.
- Normalized availability flags `is_available` and `is_preorder`.

### 3) Refresh strategy
- Add `refresh_catalog_aggregates()` function to refresh both aggregate views.
- Run every 15 minutes (or on scrape cycle checkpoints).

### 4) Partitioning roadmap
- Future step: partition `product_price_snapshots` monthly by `scraped_at`.

## Backend Caching Strategy (Redis)
- `catalog:{filters_hash}:{page}:{size}` TTL 120s.
- `product:{slug}` TTL 300s.
- `suggest:{q}:{availability}:{limit}` TTL 60s.
- `categories:list` TTL 600s.
- `recent:{limit}` TTL 120s.

## Implementation Phases
1. Add DB indexes and slug-keyed aggregate materialized views.
2. Build Go API with Postgres + Redis.
3. Migrate frontend data layer from direct Supabase to backend API.
4. Add refresh operation and operational docs.
5. Validate behavior/performance.

## Test Cases and Acceptance Criteria
- Slug detail query uses index path rather than full-table scan.
- Catalog filtering/search uses slug summary view and returns one row per slug.
- Multi-seller price history remains parallel per seller for each slug.
- Hero/description priority keeps `tlamagames/tlamagase` first fallback behavior.
- Runtime frontend data fetching no longer depends on browser-side Supabase calls.

## Assumptions and Defaults
- Keep self-hosted Supabase/Postgres as source of truth.
- Redis runs on the same Linux machine.
- Frontend breaking API change is allowed in this phase.
- Snapshot ingestion remains append-only; read models are derived.
