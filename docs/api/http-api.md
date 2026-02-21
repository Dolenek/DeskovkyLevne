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

Response row fields:
- `product_code`
- `product_name`
- `product_name_normalized`
- `product_name_search`
- `currency_code`
- `availability_label`
- `latest_price`
- `hero_image_url`
- `gallery_image_urls`
- `category_tags`

## Product Snapshots
### `GET /api/v1/products/{slug}`
Returns snapshot rows for a canonical slug.

Path params:
- `slug` (required): lowercased by server before query.

Query params:
- `history_points` (optional, int): limits response to the latest N points for the slug; backend cap is `5000`. `0` or omitted returns full history.

Error behavior:
- empty slug returns `400` with code `validation_error`.

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

Rows are sorted by `scraped_at desc, id desc`.

Response shape:
```json
{
  "rows": []
}
```

## Category Metadata
### `GET /api/v1/meta/categories`
Returns category list with counts.

Query params:
- `availability` (optional): supports `available` or `preorder`; other values behave as no availability filter.

Response shape:
```json
{
  "rows": [
    { "category": "Strategy", "count": 123 }
  ]
}
```

## Price Range Metadata
### `GET /api/v1/meta/price-range`
Returns latest-price bounds used by filters.

Query params:
- `availability` (optional): supports `available` or `preorder`; other values behave as no availability filter.
- `categories` (optional, comma-separated string): OR-match via overlap against `category_tags`.

Response shape:
```json
{
  "min_price": 199.0,
  "max_price": 1899.0
}
```

## Error Envelope
Error responses return:
```json
{
  "error": "human readable message",
  "code": "stable_machine_code",
  "request_id": "request-correlation-id"
}
```

Current codes:
- `validation_error`
- `timeout`
- `request_canceled`
- `internal_error`

## Caching Notes (Server-side)
All endpoint cache TTLs are configurable through environment variables:
- `API_CACHE_TTL_CATALOG`
- `API_CACHE_TTL_SEARCH`
- `API_CACHE_TTL_PRODUCT`
- `API_CACHE_TTL_RECENT`
- `API_CACHE_TTL_CATEGORIES`
- `API_CACHE_TTL_PRICE_RANGE`

Cache namespace is controlled by `API_CACHE_NAMESPACE`.

## Timeout Behavior
- Route-level timeouts are enforced in middleware.
- Timeout responses return `504` with `{"error":"request timed out","code":"timeout"}`.
