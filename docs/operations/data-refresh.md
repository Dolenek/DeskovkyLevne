# Data Refresh Runbook

## Why Refresh Is Needed
Catalog/search API reads from materialized views:
- `catalog_slug_seller_summary`
- `catalog_slug_summary`

After new snapshot ingestion, these views must be refreshed to expose current data through API.

## Refresh Function
Database function:
- `public.refresh_catalog_aggregates()`

Behavior:
1. Refreshes `catalog_slug_seller_summary`
2. Refreshes `catalog_slug_summary`

## Manual Refresh
```sql
select public.refresh_catalog_aggregates();
```

## Operational Guidance
- Trigger refresh after each ingestion batch or on a fixed schedule.
- For higher freshness requirements, run more frequently.
- Ensure jobs are serialized to avoid overlapping heavy refresh operations.

## Verification
- Confirm latest timestamps in `catalog_slug_summary.latest_scraped_at`.
- Spot-check product detail API for known recently updated slug.
