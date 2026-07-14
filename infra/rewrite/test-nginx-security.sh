#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_NAME="tlamasite-nginx-security-$$"
STATIC_DIR="$(mktemp -d)"

cleanup() {
  docker rm --force "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  rm -rf "${STATIC_DIR}"
}
trap cleanup EXIT

wait_for_nginx() {
  local attempt
  for attempt in $(seq 1 25); do
    if docker exec "${CONTAINER_NAME}" \
      wget --quiet --output-document=/dev/null \
      http://127.0.0.1:8081/ 2>/dev/null; then
      return 0
    fi
    sleep 0.2
  done
  docker logs "${CONTAINER_NAME}" 2>&1 || true
  echo "nginx did not become ready"
  return 1
}

printf '<!doctype html><title>TlamaSite security test</title>' \
  > "${STATIC_DIR}/index.html"
chmod 755 "${STATIC_DIR}"
chmod 644 "${STATIC_DIR}/index.html"

docker run --rm --name "${CONTAINER_NAME}" --detach \
  --volume "${SCRIPT_DIR}/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
  --volume "${STATIC_DIR}:/srv/tlamasite/dist:ro" \
  nginx:alpine >/dev/null

wait_for_nginx

header_output="$(docker exec "${CONTAINER_NAME}" \
  wget --server-response --output-document=/dev/null \
  http://127.0.0.1:8081/ 2>&1)"

required_headers=(
  'Strict-Transport-Security: max-age=31536000'
  'Content-Security-Policy:'
  'X-Content-Type-Options: nosniff'
  'X-Frame-Options: DENY'
  'Referrer-Policy: strict-origin-when-cross-origin'
  'Permissions-Policy:'
)
for required_header in "${required_headers[@]}"; do
  grep --ignore-case --fixed-strings "${required_header}" \
    <<<"${header_output}" >/dev/null
done
grep --ignore-case --fixed-strings "img-src 'self' https:" \
  <<<"${header_output}" >/dev/null

if grep --ignore-case 'strict-transport-security:.*preload' \
  <<<"${header_output}" >/dev/null; then
  echo "HSTS must not enable preload"
  exit 1
fi

docker exec "${CONTAINER_NAME}" sh -c '
  request_number=0
  while [ "${request_number}" -lt 80 ]; do
    wget -q -O /dev/null http://127.0.0.1:8081/api/rate-limit-test 2>/dev/null &
    request_number=$((request_number + 1))
  done
  wait || true
'

rate_logs="$(docker logs "${CONTAINER_NAME}" 2>&1)"
if ! grep --fixed-strings ' 429 ' <<<"${rate_logs}" >/dev/null; then
  printf '%s\n' "${rate_logs}"
  echo "nginx did not return 429 after the configured burst"
  exit 1
fi

echo "nginx headers and rate limiting verified."
