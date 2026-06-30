# Data Refresh Runbook

## Why Refresh Is Needed
Catalog/search/metadata API reads from incremental state tables:
- `catalog_slug_state`
- `catalog_slug_seller_state`

Product detail history reads `catalog_daily_price_history`. After snapshot
ingestion, daily history and catalog state must be refreshed to expose current
data through API.

Approved product aliases are stored in:
- `canonical_products`
- `canonical_product_aliases`

Alias suggestions are stored in `canonical_product_alias_candidates`. Candidate
rows are advisory and do not change runtime identity until reviewed.

## Refresh Command (Canonical)
- Refresh daily history first, then incremental catalog state:
```sql
select public.refresh_catalog_daily_price_history(now() - interval '48 hours');
select public.refresh_catalog_state_incremental(now() - interval '48 hours');
```
- Runtime uses `API_CATALOG_SUMMARY_RELATION=public.catalog_slug_state`.

## Alias Review Workflow
- Refresh pending alias suggestions:
```sql
select public.refresh_canonical_product_alias_candidates(5000);
```
- Review `canonical_product_alias_candidates` manually. Prefer candidates with
  `match_rule = 'same_seller_product_code'`; treat shared-EAN candidates as
  evidence for review, not proof.
- After approving aliases into `canonical_product_aliases`, rebuild affected
  daily history and catalog state:
```sql
select public.rebuild_catalog_daily_price_history_for_canonical_product('canonical-slug');
select public.refresh_catalog_state_incremental(null);
```
- Use the full catalog-state refresh after alias changes because aliases can
  remove stale raw-slug rows even when no recent snapshot changed.

## Materialized View Fallback
- Legacy fallback views can be refreshed with a non-blocking sequence
  (autocommit, one statement at a time):
```sql
refresh materialized view concurrently public.catalog_slug_seller_summary;
refresh materialized view concurrently public.catalog_slug_summary;
```
- Canonical SQL file: `infra/rewrite/sql/refresh-catalog-aggregates-concurrently.sql`

## Operational Guidance
- Trigger refresh after each ingestion batch or on a fixed schedule.
- Serialize refresh jobs; do not overlap refresh runs.
- If refresh fails, keep previous materialized data and retry in next cycle.
- Do not use full rebuild helper functions for routine refresh when concurrent refresh is available.

## Verification
- Confirm latest timestamps in `catalog_slug_state.latest_scraped_at`.
- Spot-check `catalog_daily_price_history.price_date` for a recently checked slug.
- Spot-check `GET /api/v1/products/{slug}` and verify rows include
  `price_date` and `snapshot_count`.
- For approved aliases, spot-check the alias slug and canonical slug. Both
  should return the same seller set, and returned `product_name_normalized`
  should be the canonical slug.
