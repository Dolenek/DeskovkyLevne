import { expect, test } from "playwright/test";
import { productDetailResponseFromRows } from "./apiMocks";
import type { Page, Route } from "playwright/test";

const alphaRow = {
  product_code: "P-ALPHA",
  product_name: "Alpha Game",
  product_name_normalized: "alpha-game",
  product_name_search: "alpha game",
  currency_code: "CZK",
  availability_label: "Nedostupné",
  stock_status_label: "Nedostupné",
  latest_price: 499,
  previous_price: 599,
  first_price: 699,
  list_price_with_vat: 799,
  source_url: "https://example.com/alpha",
  latest_scraped_at: "2026-01-01",
  hero_image_url: null,
  gallery_image_urls: [],
  seller_count: 1,
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
  availability_label: "Skladem",
  stock_status_label: "Skladem",
  seller_count: 4,
  latest_price: 649,
};

const gammaRow = {
  ...alphaRow,
  product_code: "P-GAMMA",
  product_name: "Gamma Game",
  product_name_normalized: "gamma-game",
  product_name_search: "gamma game",
  availability_label: "Skladem",
  stock_status_label: "Skladem",
  seller_count: 1,
  latest_price: 599,
};

const buildExtraRow = (index: number) => ({
  ...alphaRow,
  product_code: `P-EXTRA-${index}`,
  product_name: `Extra Game ${index}`,
  product_name_normalized: `extra-game-${index}`,
  product_name_search: `extra game ${index}`,
  seller_count: 1,
  latest_price: 700 + index,
});

const searchRows = [
  alphaRow,
  gammaRow,
  betaRow,
  ...Array.from({ length: 10 }, (_, index) => buildExtraRow(index + 3)),
];

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
      await fulfillJson(route, { rows: searchRows });
      return;
    }
    if (url.pathname.startsWith("/api/v1/products/")) {
      const slug = url.pathname.split("/").at(-1);
	  await fulfillJson(
		route,
		productDetailResponseFromRows(
		  searchRows.filter((row) => row.product_name_normalized === slug)
		)
	  );
      return;
    }
    await fulfillJson(route, { rows: [] });
  });
};

test("slash focuses search and keyboard opens highlighted suggestion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mockKeyboardSearchApi(page);
  await page.goto("/deskove-hry");

  const searchInput = page.getByRole("banner").getByRole("textbox");
  await page.locator("main").click({ position: { x: 20, y: 20 } });
  await page.keyboard.press("/");
  await expect(searchInput).toBeFocused();
  await expect(searchInput).toHaveValue("");

  await searchInput.fill("game");
  await expect(page.getByRole("button", { name: /Alpha Game/ })).toBeVisible();
  await expect(page.getByText("zaměřit hledání")).toHaveCount(0);
  await expect(page.getByText("procházet návrhy")).toBeVisible();
  await expect(page.getByText("otevřít výsledek")).toBeVisible();
  await expect(page.getByText("zavřít")).toBeVisible();
  await expect(page.locator('[data-search-result-row="true"]')).not.toHaveCount(0);
  const tallViewportResultCount = await page.locator('[data-search-result-row="true"]').count();
  expect(tallViewportResultCount).toBeLessThan(searchRows.length);
  await expect(page.locator('[data-active-result="true"]')).toContainText("Beta Game");
  await expect(page.locator('[data-search-result-row="true"]').first()).toContainText("Beta Game");
  await expect(page.locator('[data-search-result-row="true"]').nth(1)).toContainText("Gamma Game");

  await page.setViewportSize({ width: 1280, height: 560 });
  await expect
    .poll(() => page.locator('[data-search-result-row="true"]').count())
    .toBeLessThan(tallViewportResultCount);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect
    .poll(() => page.locator('[data-search-result-row="true"]').count())
    .toBe(tallViewportResultCount);
  await expect(page.locator('[data-active-result="true"]')).toContainText("Beta Game");

  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-active-result="true"]')).toContainText("Gamma Game");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-active-result="true"]')).toContainText("Alpha Game");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-active-result="true"]')).toContainText("Extra Game 3");
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('[data-active-result="true"]')).toContainText("Alpha Game");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/deskove-hry\/alpha-game$/);
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
