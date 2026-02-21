# Data Refresh Runbook

## Why Refresh Is Needed
Catalog/search/metadata API reads from materialized views:
- `catalog_slug_seller_summary`
- `catalog_slug_summary`

After snapshot ingestion, these views must be refreshed to expose current data through API.

## Refresh Command (Canonical)
- Non-blocking sequence (autocommit, one statement at a time):
```sql
refresh materialized view concurrently public.catalog_slug_seller_summary;
refresh materialized view concurrently public.catalog_slug_summary;
```
- Canonical SQL file: `infra/rewrite/sql/refresh-catalog-aggregates-concurrently.sql`

## Incremental Refresh Path
- For incremental-state tables:
```sql
select public.refresh_catalog_state_incremental(now() - interval '48 hours');
```
- Runtime cutover requires `API_CATALOG_SUMMARY_RELATION=public.catalog_slug_state`.

## Operational Guidance
- Trigger refresh after each ingestion batch or on a fixed schedule.
- Serialize refresh jobs; do not overlap refresh runs.
- If refresh fails, keep previous materialized data and retry in next cycle.
- Do not use full rebuild helper functions for routine refresh when concurrent refresh is available.

## Verification
- Confirm latest timestamps in `catalog_slug_summary.latest_scraped_at`.
- Spot-check `GET /api/v1/products/{slug}` for a recently ingested slug.
