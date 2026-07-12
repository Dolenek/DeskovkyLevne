# HTTP API Contract

Application endpoints use the `/api/v1` base path. Operational endpoints are
served from the root.

## Operational Endpoints

### `GET /health`

Liveness probe. It reports that the HTTP process is running and does not query
external dependencies.

```json
{ "status": "ok" }
```

### `GET /ready`

Readiness probe. It verifies that PostgreSQL accepts a connection. A failure
returns `503` with code `not_ready`.

```json
{ "status": "ready" }
```

### `GET /version`

Returns deployment identity embedded at build time.

```json
{
  "version": "v1.2.3",
  "commit": "abc123def456",
  "built_at": "2026-07-11T20:00:00Z"
}
```

## Validation Rules

Invalid integers, prices, enum values, ranges, overlong queries, product-code
allowlists, and unsupported filter options
return `400 validation_error`. Page sizes above the configured maximum are
capped. Prices must be finite and non-negative, and `min_price` must not exceed
`max_price`.

Supported values:

- `availability`: `available`, `preorder`
- `categories`: `strategicka`, `rodinna`, `fantasy`, `kooperativni`, `ekonomicka`
- `players`: `1-2`, `2-4`, `4-plus`
- `playtime`: `under-30`, `30-60`, `60-plus`
- `age`: `6`, `8`, `10`, `12`
- `price_movement`: `decreased`

## Catalog

### `GET /api/v1/catalog`

Returns canonical rows from `catalog_slug_state`.

Query parameters:

- `limit`: default `20`, capped by `API_MAX_PAGE_SIZE`
- `offset`: default `0`, maximum `1000000`
- `availability`, `categories`, `players`, `playtime`, `age`, `price_movement`
- `min_price`, `max_price`
- `q`: token search against canonical search text and product code
- `product_codes`: optional comma-separated allowlist, capped at 200 values
  and 120 characters per value; filtering happens before totals and pagination
- `random_seed`: deterministic pseudo-random ordering for small selections

Normal ordering is stable by product name and canonical slug. The exact total
is calculated with the page query; an out-of-range non-zero offset uses a
fallback count query.
Catalog `q` uses the same 120-character limit as search suggestions.
Catalog rows include `seller_count` from the canonical read model.

```json
{
  "rows": [],
  "total": 0,
  "total_estimate": 0,
  "limit": 20,
  "offset": 0
}
```

### `GET /api/v1/catalog/overview`

Returns live unfiltered catalog counts. `total` is every canonical slug and
`available` counts slugs available from at least one seller.

```json
{
  "total": 22002,
  "available": 17424
}
```

## Search Suggestions

### `GET /api/v1/search/suggest`

`q` values shorter than two characters return an empty list. Queries longer
than 120 characters are rejected. Search tokens are punctuation-insensitive,
diacritic-insensitive, and must all match in any order.

Optional parameters:

- `availability`
- `limit`: default `60`, capped by `API_MAX_PAGE_SIZE`
- `product_codes`: optional validated allowlist with the catalog limits

Each row includes canonical slug, product name/code, current price, currency,
availability, images, `seller_count`, and category tags.

```json
{ "rows": [] }
```

## Product Detail

### `GET /api/v1/products/{slug}`

Resolves canonical and approved alias slugs. An unknown slug returns
`404 not_found`.

`history_points` limits the latest seller-day points **per seller**. It defaults
to `0` (full history) and is capped at `5000`. Limiting each seller separately
ensures that one seller cannot displace another from the chart.

Seller presentation metadata is returned once. Compact history points are
nested beneath that seller:

```json
{
  "product_name_normalized": "canonical-slug",
  "sellers": [
    {
      "seller": "tlamagames",
      "product_code": "ABC123",
      "product_name": "Example game",
      "currency_code": "CZK",
      "availability_label": "Skladem",
      "stock_status_label": null,
      "latest_price": 799,
      "previous_price": 899,
      "first_price": 999,
      "list_price_with_vat": 999,
      "source_url": "https://example.test/product",
      "latest_scraped_at": "2026-07-11 15:26:17+02",
      "hero_image_url": "https://example.test/image.jpg",
      "gallery_image_urls": [],
      "short_description": "...",
      "supplementary_parameters": [],
      "metadata": {},
      "history": [
        {
          "price_date": "2026-07-11",
          "price_with_vat": 799,
          "list_price_with_vat": 999,
          "currency_code": "CZK",
          "scraped_at": "2026-07-11 15:26:17+02",
          "snapshot_count": 1
        }
      ]
    }
  ]
}
```

Sellers are ordered with `tlamagames` and `tlamagase` first. History remains
separate for every seller and is never merged into a synthetic series.

## Recent Discounts

### `GET /api/v1/discounts/recent`

Returns a compact seller-level discount feed from `catalog_slug_seller_state`.
Prices are compared only within the same seller. A row is eligible when the
latest price is below its previous different price or below the list price.

- `limit`: default `10`, capped at `100`

```json
{
  "rows": [
    {
      "product_name_normalized": "canonical-slug",
      "seller": "tlamagames",
      "product_code": "ABC123",
      "product_name": "Example game",
      "currency_code": "CZK",
      "current_price": 799,
      "reference_price": 899,
      "source_url": "https://example.test/product",
      "changed_at": "2026-07-11 15:26:17+02"
    }
  ]
}
```

## Filter Metadata

### `GET /api/v1/meta/filter-options`

Returns the supported filter values and display labels. This curated endpoint
is the sole category-option source; raw category-tag counts are not exposed.

### `GET /api/v1/meta/price-range`

Returns `min_price` and `max_price` for the active supported filters. Explicit
price parameters are ignored because the endpoint calculates those bounds.

## Errors

```json
{
  "error": "human readable message",
  "code": "stable_machine_code",
  "request_id": "request-correlation-id"
}
```

Current codes:

- `validation_error`
- `not_found`
- `not_ready`
- `timeout`
- `request_canceled`
- `internal_error`

## Caching and Transport

Successful public read responses include `Cache-Control` with endpoint-specific
freshness and stale-while-revalidate values. Server-side Redis keys use the
`api-v2` namespace by default. Concurrent misses are coalesced without tying the
shared load to the first caller's cancellation. JSON responses support gzip
compression when requested by the client.
