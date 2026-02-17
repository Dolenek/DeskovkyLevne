# Deskovky Levně

Deskovky Levně is a React + Vite single-page app that tracks Czech board-game prices by canonical product slug (`product_name_normalized`). It combines every seller for a slug, lets users search/filter, and renders a multi-seller price history graph with per-seller legends (no price lines are merged).

**What the site does**
- Landing page: full-text search (CZ/EN UI) with debounced overlay suggestions, plus a paginated catalog filtered by availability, price range, and game categories extracted from supplementary parameters.
- Detail page: `/deskove-hry/:slug` shows hero/gallery, availability badge, seller CTA, latest/list price, and a Recharts history where each seller has its own line; supplementary parameters replace the old data table.
- Routing: lightweight history-based navigation with slug-first URLs; logo click returns home.
- Assets priority: hero text/images prefer Tlamagames/Tlamagase, then fall back to other sellers; galleries merge unique images across sellers.
- SEO: dynamic titles, canonical links, Open Graph/Twitter tags, JSON-LD (`WebSite` on home, `Product` with per-seller `Offer` on detail), and `VITE_SITE_URL` can set the absolute origin.

**Runtime architecture**
- Frontend now reads catalog/search/detail data through a backend API (`/api/v1/...`) instead of browser-side direct Supabase reads.
- New API service lives in `apps/api-go` (Go + Postgres + optional Redis cache).
- Database read models for API are `catalog_slug_summary` and `catalog_slug_seller_summary` (slug-keyed materialized views).

**Frontend env**
- `VITE_API_BASE_URL` defaults to `http://localhost:8080` and should point to the API service in production.

**API deploy files**
- `apps/api-go`: Go backend source + Dockerfile.
- `infra/rewrite/docker-compose.api-go.yml`: API + Redis compose stack.
- `infra/rewrite/deploy-api-go.sh`: helper script for compose deployment (expects `DATABASE_URL`).
