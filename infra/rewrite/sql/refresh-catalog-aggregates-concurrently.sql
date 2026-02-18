-- Non-blocking refresh path for read traffic.
-- Run statements one by one in autocommit mode.

refresh materialized view concurrently public.catalog_slug_seller_summary;
refresh materialized view concurrently public.catalog_slug_summary;
