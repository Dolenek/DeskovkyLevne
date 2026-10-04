# API Go Service

Backend read API for catalog/search/product snapshot endpoints.

Canonical API and operations docs are in:
- `../../docs/api/http-api.md`
- `../../docs/operations/configuration.md`
- `../../docs/operations/build-and-deploy.md`

## Endpoints
- `GET /health`
- `GET /ready`
- `GET /version`
- `GET /api/v1/catalog`
- `GET /api/v1/search/suggest`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/discounts/recent`
- `GET /api/v1/meta/filter-options`
- `GET /api/v1/meta/price-range`

## Environment
Use `.env.example` and set:
- `DATABASE_URL`
- `FRONTEND_ORIGIN`
- Database role (`API_DATABASE_ROLE`, default `tlamasite_api`)
- Trusted proxy CIDRs and header limits (`API_TRUSTED_PROXY_CIDRS`,
  `API_READ_HEADER_TIMEOUT`, `API_MAX_HEADER_BYTES`)
- Optional read-model source (`API_CATALOG_SUMMARY_RELATION`)
- Optional DB pool/runtime tuning (`API_DB_*`, `API_TIMEOUT_*`)
- Optional Redis (`REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_DB`)
- Optional cache tuning (`API_CACHE_*`)

## Run
From the repository root, `npm run api:dev` loads `apps/api-go/.env` and starts
only the API. See the canonical [local development guide](../../docs/operations/build-and-deploy.md#local-development).
Direct Go invocation requires the variables to be exported in the process environment:

```bash
go run ./cmd/server
```

## Build
```bash
go build ./cmd/server
```
