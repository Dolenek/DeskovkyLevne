#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if [[ -z "${FRONTEND_ORIGIN:-}" ]]; then
  FRONTEND_ORIGIN="http://localhost:5173"
fi

export API_VERSION="${API_VERSION:-$(git -C "${ROOT_DIR}" describe --always --dirty 2>/dev/null || echo development)}"
export API_COMMIT="${API_COMMIT:-$(git -C "${ROOT_DIR}" rev-parse --short=12 HEAD 2>/dev/null || echo unknown)}"
export API_BUILT_AT="${API_BUILT_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

cd "${SCRIPT_DIR}"
if docker compose version >/dev/null 2>&1; then
  docker compose -f docker-compose.api-go.yml up -d --build
else
  docker-compose -f docker-compose.api-go.yml up -d --build
fi

API_URL="http://localhost:${API_GO_PORT:-18080}"
for _ in $(seq 1 30); do
  if curl --silent --fail "${API_URL}/ready" >/dev/null; then
    break
  fi
  sleep 1
done

curl --silent --show-error --fail "${API_URL}/health" >/dev/null
curl --silent --show-error --fail "${API_URL}/ready" >/dev/null
curl --silent --show-error --fail "${API_URL}/version" >/dev/null
curl --silent --show-error --fail "${API_URL}/api/v1/catalog?limit=1" >/dev/null
overview_payload="$(curl --silent --show-error --fail \
  "${API_URL}/api/v1/catalog/overview")"
if [[ "${overview_payload}" != *'"available"'* ]]; then
  echo "Catalog overview smoke check is missing available count"
  exit 1
fi
curl --silent --show-error --fail "${API_URL}/api/v1/discounts/recent?limit=1" >/dev/null
search_payload="$(curl --silent --show-error --fail \
  "${API_URL}/api/v1/search/suggest?q=ca&limit=1")"
if [[ "${search_payload}" != *'"seller_count"'* ]]; then
  echo "Search contract smoke check is missing seller_count"
  exit 1
fi

not_found_status="$(curl --silent --output /dev/null --write-out '%{http_code}' \
  "${API_URL}/api/v1/products/deployment-contract-missing-product")"
if [[ "${not_found_status}" != "404" ]]; then
  echo "Expected product not-found smoke check to return 404, got ${not_found_status}"
  exit 1
fi

echo "API deploy and contract smoke checks finished."
