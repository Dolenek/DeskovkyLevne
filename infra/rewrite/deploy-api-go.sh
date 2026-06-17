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

cd "${SCRIPT_DIR}"
if docker compose version >/dev/null 2>&1; then
  docker compose -f docker-compose.api-go.yml up -d --build
else
  docker-compose -f docker-compose.api-go.yml up -d --build
fi

echo "API deploy finished."
echo "Health check: curl http://localhost:${API_GO_PORT:-18080}/health"
