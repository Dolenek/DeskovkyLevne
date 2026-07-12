import { expect, test } from "playwright/test";
import { baseCatalogRow as catalogRow } from "./apiMocks";

test("filter metadata comes from API and reset clears active filters", async ({ page }) => {
  const filterOptionUrls: string[] = [];
  const priceRangeUrls: string[] = [];
  await page.route("**/api/v1/meta/filter-options**", async (route) => {
    filterOptionUrls.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      categories: [{ value: "strategicka", label: "Strategy" }, { value: "rodinna", label: "Family" }],
      player_ranges: [{ value: "1-2", label: "1-2" }, { value: "2-4", label: "2-4" }, { value: "4-plus", label: "4+" }],
      playtime_ranges: [{ value: "30-60", label: "30-60 min" }],
      age_ratings: [{ value: "8", label: "8+" }],
      availability: [{ value: "available", label: "Skladem" }],
      price_movement: [{ value: "decreased", label: "Sale" }],
    }) });
  });
  await page.route("**/api/v1/meta/price-range**", async (route) => {
    priceRangeUrls.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"min_price\":149,\"max_price\":1999}" });
  });
  await page.route("**/api/v1/catalog**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      rows: [catalogRow], total: 1, total_estimate: 1, limit: 10, offset: 0,
    }) });
  });
  await page.route("**/api/v1/search/suggest**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"rows\":[]}" });
  });

  await page.goto("/deskove-hry");
  await expect(page.getByRole("banner").getByRole("link", { name: "Katalog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "E-shopy" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Rodinn/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Strategick/ }).first()).toBeVisible();
  await expect.poll(() => filterOptionUrls.length).toBeGreaterThan(0);
  await expect(page.locator('input[type="range"]').first()).toHaveAttribute("max", "1999");
  await expect(page.getByText("Nejvýhodnější ceny")).toHaveCount(0);
  await expect(page.getByText("od 3 e-shopů")).toBeVisible();
  await expect(page.locator("main svg.lucide-star")).toHaveCount(0);
  await page.getByRole("button", { name: /Strategick/ }).first().click();
  await expect(page.locator("span").filter({ hasText: "Strategická" })).toBeVisible();
  await expect.poll(() => priceRangeUrls.some((url) => url.includes("categories=strategicka"))).toBe(true);
  await page.getByLabel("Skladem").click();
  await expect(page.getByText("Skladem").last()).toBeVisible();
  await expect.poll(() => priceRangeUrls.some((url) => url.includes("availability=available"))).toBe(true);
  const saleFilter = page.getByLabel(/slev/i);
  await saleFilter.click();
  await expect(page.getByText("Ve slevě").last()).toBeVisible();
  await expect.poll(() => priceRangeUrls.some((url) => url.includes("price_movement=decreased"))).toBe(true);
  await page.getByRole("button", { name: /Vymazat/ }).click();
  await expect(page.getByRole("button", { name: /Vymazat/ })).toHaveCount(0);
  await expect(page.getByLabel("Skladem")).not.toBeChecked();
  await expect(saleFilter).not.toBeChecked();
});

test("catalog and search overlay show skeletons while API responses are pending", async ({ page }) => {
  let releaseCatalogResponse: () => void = () => undefined;
  let releaseSearchResponse: () => void = () => undefined;
  const catalogPending = new Promise<void>((resolve) => { releaseCatalogResponse = resolve; });
  const searchPending = new Promise<void>((resolve) => { releaseSearchResponse = resolve; });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/catalog") {
      await catalogPending;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        rows: [catalogRow], total: 1, total_estimate: 1, limit: 10, offset: 0,
      }) });
      return;
    }
    if (path === "/api/v1/search/suggest") {
      await searchPending;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ rows: [catalogRow] }) });
      return;
    }
    if (path === "/api/v1/meta/price-range") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{\"min_price\":149,\"max_price\":1999}" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      categories: [], player_ranges: [], playtime_ranges: [], age_ratings: [], availability: [], price_movement: [],
    }) });
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
