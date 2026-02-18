-- Apply after confirming there is no consumer for public.product_catalog_index.

drop materialized view if exists public.product_catalog_index;
