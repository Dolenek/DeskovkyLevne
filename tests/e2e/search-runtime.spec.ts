import { expect, test } from "playwright/test";
import { baseCatalogRow as catalogRow, mockSearchPageApi } from "./apiMocks";

test("search normalizes punctuation and matches non-adjacent tokens", async ({ page }) => {
  const searchQueries: string[] = [];
  const partyRow = {
    ...catalogRow,
    product_code: "P-PARTY",
    product_name: "Výbušná koťátka: párty karty",
    product_name_normalized: "vybusna-kotatka-party-karty",
    product_name_search: "vybusna kotatka party karty",
    latest_price: 615,
  };

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/catalog") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rows: [catalogRow], total: 1, total_estimate: 1, limit: 10, offset: 0,
        }),
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/filter-options") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          categories: [], player_ranges: [], playtime_ranges: [],
          age_ratings: [], availability: [], price_movement: [],
        }),
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/price-range") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ min_price: 149, max_price: 1999 }),
      });
      return;
    }
    if (url.pathname === "/api/v1/search/suggest") {
      const query = url.searchParams.get("q") ?? "";
      searchQueries.push(query);
      const rows = query === "vybusna kotatka party karty" || query === "vybusna party"
        ? [partyRow]
        : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rows: [] }),
    });
  });

  await page.goto("/deskove-hry");
  const searchInput = page.getByRole("banner").getByRole("textbox");
  await searchInput.fill("Výbušná koťátka: párty karty");
  await expect.poll(() => searchQueries.at(-1)).toBe("vybusna kotatka party karty");
  await expect(page.getByRole("button", { name: /Výbušná koťátka/ })).toBeVisible();

  await searchInput.fill("Výbušná párty");
  await expect.poll(() => searchQueries.includes("vybusna party")).toBe(true);
  await expect(page.getByRole("button", { name: /Výbušná koťátka/ })).toBeVisible();
});

test("search keeps latest result when previous request is slower", async ({ page }) => {
  await mockSearchPageApi(page);

  await page.route("**/api/v1/search/suggest**", async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q");
    if (query === "ab") {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: [{
          product_code: "P-AB", product_name: "Slow Result",
          product_name_normalized: "slow-result", product_name_search: "slow result",
          currency_code: "CZK", availability_label: "Skladem", latest_price: 500,
          hero_image_url: null, gallery_image_urls: [], category_tags: ["Strategy"],
        }] }),
      });
      return;
    }
    if (query === "abc") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: [{
          product_code: "P-ABC", product_name: "Fast Result",
          product_name_normalized: "fast-result", product_name_search: "fast result",
          currency_code: "CZK", availability_label: "Skladem", latest_price: 450,
          hero_image_url: null, gallery_image_urls: [], category_tags: ["Strategy"],
        }] }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"rows\":[]}" });
  });

  await page.goto("/deskove-hry");
  const searchInput = page.getByRole("banner").getByRole("textbox");
  await searchInput.fill("ab");
  await page.waitForTimeout(500);
  await searchInput.fill("abc");
  await expect(page.getByText("Fast Result")).toBeVisible();
  await page.waitForTimeout(1300);
  await expect(page.getByText("Slow Result")).toHaveCount(0);
});

test("catalog renders a mock product when API requests cannot be reached", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => route.abort("failed"));
  await page.goto("/deskove-hry");
  await expect(page.getByText("Failed to fetch")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ukázková hra cenové historie" })).toBeVisible();
  await expect(page.getByText("Zobrazit detail")).toBeVisible();
});

test("catalog renders a mock product when API returns 500", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "local API unavailable" }),
    });
  });
  await page.goto("/deskove-hry");
  await expect(page.getByText("API request failed (500)")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ukázková hra cenové historie" })).toBeVisible();
});
