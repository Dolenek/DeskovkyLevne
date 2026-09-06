import { describe, expect, it } from "vitest";
import { buildCatalogStatePath, readCatalogSelection } from "../../src/routing/catalogState";
import { catalogSelectionReducer } from "../../src/pages/search/catalogSelectionReducer";
import { paginationNumbers } from "../../src/pages/search/paginationNumbers";
import { formatPrice } from "../../src/utils/numberFormat";
import { formatSellerCount } from "../../src/utils/sellerCount";

describe("shareable catalog selection", () => {
  it("round trips all filters, zero price, page and sort", () => {
    const search =
      "?categories=strategicka,rodinna&players=4-plus&playtime=30-60&age=8&availability=available&price_movement=decreased&min_price=0&max_price=1200&page=6&sort=price_desc";
    const selection = readCatalogSelection(search);
    const url = new URL(buildCatalogStatePath("Česká hra", selection), "https://example.test");
    expect(readCatalogSelection(url.search)).toEqual(selection);
    expect(url.searchParams.get("q")).toBe("Česká hra");
  });
  it("normalizes invalid URL values and removes one chip without resetting others", () => {
    const selection = readCatalogSelection(
      "?categories=invalid,rodinna&players=4-plus&page=-3&sort=sql&min_price=500&max_price=100",
    );
    expect(selection).toMatchObject({
      pricePage: 1,
      sort: "name",
      categoryFilters: ["rodinna"],
      priceFilter: { min: "100", max: "500" },
    });
    const next = catalogSelectionReducer(selection, { type: "remove", key: "players-4-plus" });
    expect(next.playerRangeFilters).toEqual([]);
    expect(next.categoryFilters).toEqual(["rodinna"]);
    expect(next.priceFilter).toEqual(selection.priceFilter);
  });
  it("keeps the current page visible beyond page five", () => {
    expect(paginationNumbers(6, 100)).toEqual([4, 5, 6, 7, 8]);
    expect(paginationNumbers(100, 100)).toEqual([96, 97, 98, 99, 100]);
  });
  it("retains fractional prices while removing zero cents", () => {
    expect(formatPrice(399, "CZK", "cs").replaceAll("\u00a0", " ")).toBe("399 Kč");
    expect(formatPrice(399.5, "CZK", "cs")).toContain("399,5");
    expect(formatSellerCount(1, "cs")).toBe("1 e-shop");
    expect(formatSellerCount(3, "cs")).toBe("3 e-shopy");
  });
});
