-- Optimizes /api/v1/snapshots/recent by supporting ORDER BY scraped_at DESC, id DESC.
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- If your migration runner wraps files in a transaction, execute this statement manually.

create index concurrently if not exists idx_product_price_snapshots_scraped_id_desc
on public.product_price_snapshots (scraped_at desc, id desc);
