import type { Page, Route } from "playwright/test";
import { baseCatalogRow, mockSearchPageApi, productDetailResponseFromRows } from "./apiMocks";

export const searchCatalogRows = Array.from({ length: 75 }, (_, index) => ({
  ...baseCatalogRow,
  product_name: `Česká hra ${String(index + 1).padStart(2, "0")}`,
  product_name_normalized: `ceska-hra-${index + 1}`,
  latest_price: index === 0 ? 99 : 2500,
}));

export const fulfillSearchJson = (route: Route, body: unknown) => route.fulfill({
  contentType: "application/json", body: JSON.stringify(body),
});

export const mockSearchResults = async (page: Page) => {
  await mockSearchPageApi(page);
  await page.route("**/api/v1/products/*", (route) => fulfillSearchJson(
    route, productDetailResponseFromRows([searchCatalogRows[0]])
  ));
  await page.route("**/api/v1/search/suggest?*", (route) => fulfillSearchJson(
    route, { rows: [searchCatalogRows[0]] }
  ));
  const requests: URL[] = [];
  await page.route("**/api/v1/catalog?*", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const query = url.searchParams.get("q");
    const rows = query === "missing" ? [] : searchCatalogRows;
    const offset = Number(url.searchParams.get("offset") ?? 0);
    await fulfillSearchJson(route, {
      rows: rows.slice(offset, offset + 10), total: rows.length, limit: 10, offset,
    });
  });
  return requests;
};
