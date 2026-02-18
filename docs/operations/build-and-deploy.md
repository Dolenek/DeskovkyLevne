# Build and Deploy

## Local Build Pipeline
Root command:
```bash
npm run build
```

Pipeline stages:
1. TypeScript build (`tsc -b`)
2. Sitemap generation (`node scripts/generate-sitemap.mjs`)
3. Vite production build (`vite build`)
4. Prerender pass (`node scripts/prerender.mjs`)

## Build-Time Data Sources
- Dynamic sitemap/prerender slugs come from `catalog_slug_summary`.
- Build scripts use Supabase client credentials from env vars.

## Fallback Behavior Without Supabase Credentials
If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing:
- sitemap generation logs warning and outputs static-only routes:
  - `/`
  - `/levne-deskovky`
  - `/deskove-hry`
- prerender logs warning and prerenders static-only routes.
- build continues successfully.

## Prerender Requirements
- Playwright is used for prerendering.
- Install browser runtime on build hosts:
```bash
npx playwright install chromium
```

## Backend Deployment Pointers
- API service code: `apps/api-go`
- Compose stack: `infra/rewrite/docker-compose.api-go.yml`
- Helper deployment script: `infra/rewrite/deploy-api-go.sh`

Required for API runtime:
- `DATABASE_URL`
