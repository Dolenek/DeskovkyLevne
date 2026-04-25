import { expect, test } from "playwright/test";
import { mockSearchPageApi } from "./apiMocks";

test("filter metadata comes from API and updates with filters", async ({ page }) => {
  const filterOptionUrls: string[] = [];
  const priceRangeUrls: string[] = [];

  await page.route("**/api/v1/meta/filter-options**", async (route) => {
    filterOptionUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        categories: [
          { value: "strategicka", label: "Strategická" },
          { value: "rodinna", label: "Rodinná" },
        ],
        player_ranges: [
          { value: "1-2", label: "1-2" },
          { value: "2-4", label: "2-4" },
          { value: "4-plus", label: "4+" },
        ],
        playtime_ranges: [{ value: "30-60", label: "30-60 min" }],
        age_ratings: [{ value: "8", label: "8+" }],
        availability: [{ value: "available", label: "Skladem" }],
        price_movement: [{ value: "decreased", label: "Ve slevě" }],
      }),
    });
  });

  await page.route("**/api/v1/meta/price-range**", async (route) => {
    priceRangeUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ min_price: 149, max_price: 1999 }),
    });
  });

  await page.route("**/api/v1/catalog**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        rows: [
          {
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
          },
        ],
        total: 1,
        total_estimate: 1,
        limit: 10,
        offset: 0,
      }),
    });
  });

  await page.route("**/api/v1/search/suggest**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rows: [] }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("button", { name: "Rodinná" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Strategická" }).first()).toBeVisible();
  await expect.poll(() => filterOptionUrls.length).toBeGreaterThan(0);
  await expect(page.locator('input[type="range"]').first()).toHaveAttribute("max", "1999");

  await page.getByRole("button", { name: "Strategická" }).first().click();
  await expect
    .poll(() => priceRangeUrls.some((entry) => entry.includes("categories=strategicka")))
    .toBe(true);

  await page.getByLabel("Skladem").click();
  await expect
    .poll(() => priceRangeUrls.some((entry) => entry.includes("availability=available")))
    .toBe(true);

  await page.getByLabel("Ve slevě").click();
  await expect
    .poll(() => priceRangeUrls.some((entry) => entry.includes("price_movement=decreased")))
    .toBe(true);
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
        body: JSON.stringify({
          rows: [
            {
              product_code: "P-AB",
              product_name: "Slow Result",
              product_name_normalized: "slow-result",
              product_name_search: "slow result",
              currency_code: "CZK",
              availability_label: "Skladem",
              latest_price: 500,
              hero_image_url: null,
              gallery_image_urls: [],
              category_tags: ["Strategy"],
            },
          ],
        }),
      });
      return;
    }

    if (query === "abc") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rows: [
            {
              product_code: "P-ABC",
              product_name: "Fast Result",
              product_name_normalized: "fast-result",
              product_name_search: "fast result",
              currency_code: "CZK",
              availability_label: "Skladem",
              latest_price: 450,
              hero_image_url: null,
              gallery_image_urls: [],
              category_tags: ["Strategy"],
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rows: [] }),
    });
  });

  await page.goto("/");
  const searchInput = page.getByPlaceholder(/Zadejte název hry nebo kód|Type a product name or code/);
  await searchInput.fill("ab");
  await page.waitForTimeout(500);
  await searchInput.fill("abc");

  await expect(page.getByText("Fast Result")).toBeVisible();
  await page.waitForTimeout(1300);
  await expect(page.getByText("Slow Result")).toHaveCount(0);
});
