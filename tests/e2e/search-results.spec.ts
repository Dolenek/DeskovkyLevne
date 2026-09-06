import { expect, test } from "playwright/test";
import { fulfillSearchJson, mockSearchResults, searchCatalogRows } from "./searchResultsMocks";

test("immediate Enter searches the full catalog and paginates independently of suggestions", async ({ page }) => {
  const requests = await mockSearchResults(page);
  await page.goto("/");
  const input = page.getByRole("banner").getByRole("textbox");
  await input.fill("Česká hra");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/deskove-hry\?q=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Výsledky vyhledávání pro „Česká hra“");
  await expect(page.getByRole("heading", { name: /Zobrazeno/ })).toContainText("75");
  await expect(page.locator('main a[href^="/deskove-hry/"]')).toHaveCount(10);
  expect(requests.at(-1)?.searchParams.get("q")).toBe("ceska hra");
  expect(requests.at(-1)?.searchParams.has("min_price")).toBe(false);
  expect(requests.at(-1)?.searchParams.has("max_price")).toBe(false);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Česká hra 11", exact: true })).toBeVisible();
  expect(requests.at(-1)?.searchParams.get("q")).toBe("ceska hra");
  expect(requests.at(-1)?.searchParams.get("offset")).toBe("10");
});

test("direct links, refresh and history restore the query; a card opens its slug", async ({ page }) => {
  await mockSearchResults(page);
  await page.goto("/deskove-hry?q=%C4%8Cesk%C3%A1+hra");
  await expect(page.getByRole("banner").getByRole("textbox")).toHaveValue("Česká hra");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Česká hra");
  await page.locator('main a[href="/deskove-hry/ceska-hra-1"]').click();
  await expect(page).toHaveURL(/\/deskove-hry\/ceska-hra-1$/);
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Česká hra");
  const input = page.getByRole("banner").getByRole("textbox");
  await input.fill("missing");
  await input.press("Enter");
  await expect(page.getByText('Nic jsme nenašli pro "missing".')).toBeVisible();
  await page.goBack();
  await expect(input).toHaveValue("Česká hra");
  await page.goForward();
  await expect(input).toHaveValue("missing");
});

test("filters preserve query and resubmitting the same query resets filters and pagination", async ({ page }) => {
  const requests = await mockSearchResults(page);
  await page.goto("/deskove-hry?q=hra");
  await page.getByRole("button", { name: "Strategické", exact: true }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get("categories")).toBe("strategicka");
  expect(requests.at(-1)?.searchParams.get("q")).toBe("hra");
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get("offset")).toBe("10");
  const input = page.locator('main form[role="search"] input');
  await input.press("Enter");
  await expect.poll(() => requests.at(-1)?.searchParams.has("categories")).toBe(false);
  expect(requests.at(-1)?.searchParams.get("offset")).toBe("0");
  expect(requests.at(-1)?.searchParams.get("q")).toBe("hra");
});

for (const width of [1280, 390]) {
  test(`landing search button and product header submit at width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockSearchResults(page);
    await page.goto("/");
    await page.locator('main form[role="search"] input').fill("Česká hra");
    await expect(page.locator('[data-search-result-row="true"]')).not.toHaveCount(0);
    await page.locator('main form[role="search"]').getByRole("button", { name: "Vyhledat" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Česká hra");
    await expect(page.locator('main a[href^="/deskove-hry/"]')).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath("results.png") });
    await page.locator('main a[href="/deskove-hry/ceska-hra-1"]').click();
    await page.getByRole("banner").getByRole("textbox").fill("missing");
    await page.getByRole("banner").getByRole("button", { name: "Vyhledat" }).click();
    await expect(page.getByText('Nic jsme nenašli pro "missing".')).toBeVisible();
  });
}

test("catalog failure offers retry without a mock product", async ({ page }) => {
  await mockSearchResults(page);
  let failing = true;
  await page.route("**/api/v1/catalog?*", async (route) => {
    if (failing) return route.fulfill({ status: 503, body: "Unavailable" });
    await fulfillSearchJson(route, { rows: [searchCatalogRows[0]], total: 1 });
  });
  await page.goto("/deskove-hry?q=hra");
  await expect(page.getByRole("button", { name: "Zkusit znovu" })).toBeVisible();
  await expect(page.locator('main a[href^="/deskove-hry/"]')).toHaveCount(0);
  failing = false;
  await page.getByRole("button", { name: "Zkusit znovu" }).click();
  await expect(page.getByRole("heading", { name: "Česká hra 01" })).toBeVisible();
});

test("empty search clears the query and empty filtered results can reset filters", async ({ page }) => {
  const requests = await mockSearchResults(page);
  await page.goto("/deskove-hry?q=missing");
  await page.getByRole("button", { name: "Strategické", exact: true }).click();
  await expect(page.getByText('Nic jsme nenašli pro "missing".')).toBeVisible();
  await page.getByRole("button", { name: "Vymazat vše" }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.has("categories")).toBe(false);
  expect(requests.at(-1)?.searchParams.get("q")).toBe("missing");
  const input = page.getByRole("banner").getByRole("textbox");
  for (const query of ["?! / …", ""]) {
    await input.fill(query);
    await input.press("Enter");
    await expect(page).toHaveURL(/\/deskove-hry$/);
    await expect(page.locator('main a[href^="/deskove-hry/"]')).toHaveCount(10);
    expect(requests.at(-1)?.searchParams.has("q")).toBe(false);
    expect(requests.at(-1)?.searchParams.has("min_price")).toBe(false);
  }
});

test("search labels translate to English and Enter on a retry button keeps native behavior", async ({ page }) => {
  await mockSearchResults(page);
  await page.goto("/deskove-hry?q=missing");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText('Search results for “missing”');
  await expect(page.getByText('No matches for "missing".')).toBeVisible();
  await page.route("**/api/v1/search/suggest?*", (route) => route.fulfill({
    status: 400, contentType: "application/json", body: JSON.stringify({ error: "Suggestion failed" }),
  }));
  const input = page.getByRole("banner").getByRole("textbox");
  await input.fill("next");
  const retry = page.getByRole("button", { name: "Try again" });
  await expect(retry).toBeVisible();
  await retry.focus();
  const request = page.waitForRequest("**/api/v1/search/suggest?*");
  await retry.press("Enter");
  await request;
  await expect(page).toHaveURL(/\?q=missing$/);
});

test("an older response cannot overwrite a newly submitted query", async ({ page }) => {
  await mockSearchResults(page);
  let releaseOldResponse = () => {};
  const pending = new Promise<void>((resolve) => { releaseOldResponse = resolve; });
  await page.route("**/api/v1/catalog?*", async (route) => {
    if (new URL(route.request().url()).searchParams.get("q") !== "old") return route.fallback();
    await pending;
    await fulfillSearchJson(route, { rows: [searchCatalogRows[0]], total: 1 });
  });
  await page.goto("/deskove-hry?q=old");
  const input = page.getByRole("banner").getByRole("textbox");
  await input.fill("missing");
  await input.press("Enter");
  await expect(page.getByText('Nic jsme nenašli pro "missing".')).toBeVisible();
  releaseOldResponse();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("missing");
  await expect(page.locator('main a[href^="/deskove-hry/"]')).toHaveCount(0);
});

test("long URL queries wrap on mobile and are limited to 120 characters", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await mockSearchResults(page);
  await page.goto(`/deskove-hry?q=${"a".repeat(150)}`);
  await expect(page.getByRole("banner").getByRole("textbox")).toHaveValue("a".repeat(120));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
