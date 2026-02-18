# Data Refresh Runbook

## Why Refresh Is Needed
Catalog/search API reads from materialized views:
- `catalog_slug_seller_summary`
- `catalog_slug_summary`

After snapshot ingestion, these views must be refreshed to expose current data through API.

## Refresh Options
- Legacy function:
```sql
select public.refresh_catalog_aggregates();
```
- Preferred non-blocking sequence (autocommit, one statement at a time):
```sql
refresh materialized view concurrently public.catalog_slug_seller_summary;
refresh materialized view concurrently public.catalog_slug_summary;
```
- Canonical SQL file: `infra/rewrite/sql/refresh-catalog-aggregates-concurrently.sql`

## Operational Guidance
- Trigger refresh after each ingestion batch or on a fixed schedule.
- Serialize refresh jobs; do not overlap refresh runs.
- If refresh fails, keep previous materialized data and retry in next cycle.

## Verification
- Confirm latest timestamps in `catalog_slug_summary.latest_scraped_at`.
- Spot-check `GET /api/v1/products/{slug}` for a recently ingested slug.
