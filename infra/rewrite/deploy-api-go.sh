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
docker compose -f docker-compose.api-go.yml up -d --build

echo "API deploy finished."
echo "Health check: curl http://localhost:8080/health"
