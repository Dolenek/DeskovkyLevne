-- Phase 1 index cleanup for slug-first API read path.
-- Run in autocommit mode, one statement at a time.
-- CREATE/DROP INDEX CONCURRENTLY cannot run in a transaction block.

-- Duplicate index:
-- catalog_slug_seller_summary_slug_idx is covered by
-- catalog_slug_seller_summary_slug_seller_idx (left-prefix match on slug).
drop index concurrently if exists public.catalog_slug_seller_summary_slug_idx;

-- Candidate large low-scan indexes on snapshots table.
-- Keep disabled by default until workload review confirms no demand.
-- drop index concurrently if exists public.idx_product_price_snapshots_name_trgm;
-- drop index concurrently if exists public.idx_product_price_snapshots_code_trgm;
-- drop index concurrently if exists public.idx_product_price_snapshots_scraped_at_desc;
