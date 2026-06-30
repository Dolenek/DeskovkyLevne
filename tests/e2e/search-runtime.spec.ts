import { expect, test } from "playwright/test";
import { mockSearchPageApi } from "./apiMocks";

const catalogRow = {
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
  category_tags: ["Strategicka"],
};

test("filter metadata comes from API and reset clears active filters", async ({ page }) => {
  const filterOptionUrls: string[] = [];
  const priceRangeUrls: string[] = [];

  await page.route("**/api/v1/meta/filter-options**", async (route) => {
    filterOptionUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        categories: [
          { value: "strategicka", label: "Strategy" },
          { value: "rodinna", label: "Family" },
        ],
        player_ranges: [
          { value: "1-2", label: "1-2" },
          { value: "2-4", label: "2-4" },
          { value: "4-plus", label: "4+" },
        ],
        playtime_ranges: [{ value: "30-60", label: "30-60 min" }],
        age_ratings: [{ value: "8", label: "8+" }],
        availability: [{ value: "available", label: "Skladem" }],
        price_movement: [{ value: "decreased", label: "Sale" }],
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
        rows: [catalogRow],
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

  await page.goto("/deskove-hry");

  await expect(page.getByRole("banner").getByRole("link", { name: "Katalog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "E-shopy" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Rodinn/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Strategick/ }).first()).toBeVisible();
  await expect.poll(() => filterOptionUrls.length).toBeGreaterThan(0);
  await expect(page.locator('input[type="range"]').first()).toHaveAttribute("max", "1999");
  await expect(page.getByText("Nejvýhodnější ceny")).toHaveCount(0);

  await page.getByRole("button", { name: /Strategick/ }).first().click();
  await expect(page.locator("span").filter({ hasText: "Strategy" })).toBeVisible();
  await expect
    .poll(() => priceRangeUrls.some((entry) => entry.includes("categories=strategicka")))
    .toBe(true);

  await page.getByLabel("Skladem").click();
  await expect(page.getByText("Skladem").last()).toBeVisible();
  await expect
    .poll(() => priceRangeUrls.some((entry) => entry.includes("availability=available")))
    .toBe(true);

  const saleFilter = page.getByLabel(/slev/i);
  await saleFilter.click();
  await expect(page.getByText("Sale").last()).toBeVisible();
  await expect
    .poll(() => priceRangeUrls.some((entry) => entry.includes("price_movement=decreased")))
    .toBe(true);

  await page.getByRole("button", { name: /Vymazat/ }).click();
  await expect(page.getByRole("button", { name: /Vymazat/ })).toHaveCount(0);
  await expect(page.getByLabel("Skladem")).not.toBeChecked();
  await expect(saleFilter).not.toBeChecked();
});

test("catalog and search overlay show skeletons while API responses are pending", async ({ page }) => {
  let releaseCatalogResponse: () => void = () => undefined;
  let releaseSearchResponse: () => void = () => undefined;
  const catalogResponsePending = new Promise<void>((resolve) => {
    releaseCatalogResponse = resolve;
  });
  const searchResponsePending = new Promise<void>((resolve) => {
    releaseSearchResponse = resolve;
  });

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/catalog") {
      await catalogResponsePending;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rows: [catalogRow],
          total: 1,
          total_estimate: 1,
          limit: 10,
          offset: 0,
        }),
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/filter-options") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          categories: [],
          player_ranges: [],
          playtime_ranges: [],
          age_ratings: [],
          availability: [],
          price_movement: [],
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
      await searchResponsePending;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: [catalogRow] }),
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
  await expect(page.getByRole("status", { name: "Nacitani produktu" })).toBeVisible();
  releaseCatalogResponse();
  await expect(page.getByRole("heading", { name: "Alpha Game" })).toBeVisible();

  await page.getByRole("banner").getByRole("textbox").fill("alpha");
  await expect(page.getByRole("status", { name: "Nacitani vysledku vyhledavani" })).toBeVisible();
  releaseSearchResponse();
  await expect(page.getByRole("button", { name: /Alpha Game/ })).toBeVisible();
});

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
          rows: [catalogRow],
          total: 1,
          total_estimate: 1,
          limit: 10,
          offset: 0,
        }),
      });
      return;
    }
    if (url.pathname === "/api/v1/meta/filter-options") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          categories: [],
          player_ranges: [],
          playtime_ranges: [],
          age_ratings: [],
          availability: [],
          price_movement: [],
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
  await page.route("**/api/v1/**", async (route) => {
    await route.abort("failed");
  });

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
