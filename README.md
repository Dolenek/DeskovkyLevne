# TLAMA Prices

## Catalog index refresh (important)

The frontend now reads products from the Postgres materialized view `public.product_catalog_index`. New snapshots do **not** appear automatically – you must refresh the view whenever the scraper finishes importing data (or on a schedule) by running:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_catalog_index;
```

Until a refresh occurs, users will keep seeing the previous dataset. Please keep this step in your deployment/scrape pipeline (automation TBD).
