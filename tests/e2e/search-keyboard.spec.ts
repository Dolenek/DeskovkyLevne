import { expect, test } from "playwright/test";
import type { Page, Route } from "playwright/test";

const alphaRow = {
  product_code: "P-ALPHA",
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

const betaRow = {
  ...alphaRow,
  product_code: "P-BETA",
  product_name: "Beta Game",
  product_name_normalized: "beta-game",
  product_name_search: "beta game",
  latest_price: 649,
};

const fulfillJson = async (route: Route, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

const mockKeyboardSearchApi = async (page: Page) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/catalog") {
      await fulfillJson(route, {
        rows: [alphaRow, betaRow],
        total: 2,
        total_estimate: 2,
        limit: 10,
        offset: 0,
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/filter-options") {
      await fulfillJson(route, {
        categories: [],
        player_ranges: [],
        playtime_ranges: [],
        age_ratings: [],
        availability: [],
        price_movement: [],
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/price-range") {
      await fulfillJson(route, { min_price: 149, max_price: 1999 });
      return;
    }
    if (url.pathname === "/api/v1/search/suggest") {
      await fulfillJson(route, { rows: [alphaRow, betaRow] });
      return;
    }
    if (url.pathname === "/api/v1/products/beta-game") {
      await fulfillJson(route, { rows: [betaRow] });
      return;
    }
    await fulfillJson(route, { rows: [] });
  });
};

test("slash focuses search and keyboard opens highlighted suggestion", async ({ page }) => {
  await mockKeyboardSearchApi(page);
  await page.goto("/deskove-hry");

  const searchInput = page.getByRole("banner").getByRole("textbox");
  await page.locator("main").click({ position: { x: 20, y: 20 } });
  await page.keyboard.press("/");
  await expect(searchInput).toBeFocused();
  await expect(searchInput).toHaveValue("");

  await searchInput.fill("game");
  await expect(page.getByRole("button", { name: /Alpha Game/ })).toBeVisible();
  await expect(page.locator('[data-active-result="true"]')).toContainText("Alpha Game");

  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-active-result="true"]')).toContainText("Beta Game");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-active-result="true"]')).toContainText("Alpha Game");
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('[data-active-result="true"]')).toContainText("Beta Game");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/deskove-hry\/beta-game$/);
});

test("escape closes suggestions and slash is ignored inside search input", async ({ page }) => {
  await mockKeyboardSearchApi(page);
  await page.goto("/deskove-hry");

  const searchInput = page.getByRole("banner").getByRole("textbox");
  await searchInput.fill("ga");
  await page.keyboard.press("/");
  await expect(searchInput).toHaveValue("ga/");

  await searchInput.fill("game");
  await expect(page.getByRole("button", { name: /Alpha Game/ })).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("button", { name: /Alpha Game/ })).toHaveCount(0);
  await expect(searchInput).toHaveValue("game");
});
