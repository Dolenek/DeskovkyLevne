# API Go Service

Backend read API for catalog/search/product snapshot endpoints.

## Endpoints
- `GET /health`
- `GET /api/v1/catalog`
- `GET /api/v1/search/suggest`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/snapshots/recent`
- `GET /api/v1/meta/categories`

## Environment
Use `.env.example` and set:
- `DATABASE_URL`
- `FRONTEND_ORIGIN`
- Optional Redis (`REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_DB`)

## Run
```bash
go run ./cmd/server
```

## Build
```bash
go build ./cmd/server
```
