# API Go Service

Backend read API for catalog/search/product snapshot endpoints.

Canonical API and operations docs are in:
- `../../docs/api/http-api.md`
- `../../docs/operations/configuration.md`
- `../../docs/operations/build-and-deploy.md`

## Endpoints
- `GET /health`
- `GET /api/v1/catalog`
- `GET /api/v1/search/suggest`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/snapshots/recent`
- `GET /api/v1/meta/categories`
- `GET /api/v1/meta/price-range`

## Environment
Use `.env.example` and set:
- `DATABASE_URL`
- `FRONTEND_ORIGIN`
- Optional read-model source (`API_CATALOG_SUMMARY_RELATION`)
- Optional DB pool/runtime tuning (`API_DB_*`, `API_TIMEOUT_*`)
- Optional Redis (`REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_DB`)
- Optional cache tuning (`API_CACHE_*`)

## Run
```bash
go run ./cmd/server
```

## Build
```bash
go build ./cmd/server
```
