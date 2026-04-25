import type { Page, Route } from "playwright/test";

const baseCatalogRow = {
  product_code: "P-001",
  product_name: "Alpha Game",
  product_name_normalized: "alpha-game",
  product_name_search: "alpha game",
  currency_code: "CZK",
  availability_label: "Skladem",
  stock_status_label: "Skladem",
  latest_price: 499,
  previous_price: 599,
  first_price: 699,
  list_price_with_vat: 799,
  source_url: "https://example.com/alpha",
  latest_scraped_at: "2026-01-01",
  hero_image_url: null,
  gallery_image_urls: [],
  short_description: null,
  supplementary_parameters: [],
            metadata: {},
            price_points: [],
            category_tags: ["Strategická"],
};

const fulfillJson = async (route: Route, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

export const mockSearchPageApi = async (page: Page) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/catalog") {
      await fulfillJson(route, {
        rows: [baseCatalogRow],
        total: 1,
        total_estimate: 1,
        limit: 10,
        offset: 0,
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/filter-options") {
      await fulfillJson(route, {
        categories: [
          { value: "strategicka", label: "Strategická" },
          { value: "rodinna", label: "Rodinná" },
        ],
        player_ranges: [{ value: "2-4", label: "2-4" }],
        playtime_ranges: [{ value: "30-60", label: "30-60 min" }],
        age_ratings: [{ value: "8", label: "8+" }],
        availability: [{ value: "available", label: "Skladem" }],
        price_movement: [{ value: "decreased", label: "Ve slevě" }],
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/price-range") {
      await fulfillJson(route, {
        min_price: 149,
        max_price: 1999,
      });
      return;
    }
    if (url.pathname === "/api/v1/search/suggest") {
      await fulfillJson(route, { rows: [] });
      return;
    }
    await fulfillJson(route, { rows: [] });
  });
};
