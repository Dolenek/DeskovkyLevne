# HTTP API Contract

Base path: `/api/v1`

## Health
### `GET /health`
- Returns service health.

Response:
```json
{ "status": "ok" }
```

## Catalog
### `GET /api/v1/catalog`
Returns paginated catalog rows from `catalog_slug_summary`.

Query params:
- `limit` (optional, int): default `20`, capped by backend `API_MAX_PAGE_SIZE`.
- `offset` (optional, int): default `0`.
- `availability` (optional, string): supports `available` or `preorder`; other values behave as no availability filter.
- `min_price` (optional, float).
- `max_price` (optional, float).
- `categories` (optional, comma-separated string): OR-match via overlap against `category_tags`.
- `q` (optional, string): substring search against normalized product name and `product_code`.

Response shape:
```json
{
  "rows": [],
  "total": 0,
  "total_estimate": 0,
  "limit": 20,
  "offset": 0
}
```

## Search Suggestions
### `GET /api/v1/search/suggest`
Returns lightweight search suggestions from slug summary rows.

Query params:
- `q` (required for results): if length `< 2`, returns empty list.
- `availability` (optional): same semantics as catalog.
- `limit` (optional, int): default `60`, capped by backend max page size.

Response shape:
```json
{
  "rows": []
}
```

## Product Snapshots
### `GET /api/v1/products/{slug}`
Returns snapshot rows for a canonical slug.

Path params:
- `slug` (required): lowercased by server before query.

Error behavior:
- empty slug returns `400`.

Response shape:
```json
{
  "rows": []
}
```

## Recent Snapshots
### `GET /api/v1/snapshots/recent`
Returns latest snapshots for discount/recency features.

Query params:
- `limit` (optional, int): default `2000`, capped at `10000`.

Response shape:
```json
{
  "rows": []
}
```

## Category Metadata
### `GET /api/v1/meta/categories`
Returns category list with counts.

Response shape:
```json
{
  "rows": [
    { "category": "Strategy", "count": 123 }
  ]
}
```

## Caching Notes (Server-side)
- Catalog responses: TTL 120s.
- Suggest responses: TTL 60s.
- Product detail snapshots: TTL 300s.
- Recent snapshots: TTL 120s.
- Category list: TTL 600s.
