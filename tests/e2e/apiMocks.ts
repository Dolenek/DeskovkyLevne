import type { Page, Route } from "playwright/test";

export const baseCatalogRow = {
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

type ProductFixtureRow = Record<string, unknown>;

const firstNonEmptyValue = (rows: ProductFixtureRow[], key: string) =>
  rows.map((row) => row[key]).find((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  ) ?? null;

const buildSellerFixture = (sellerRows: ProductFixtureRow[], seller: string) => {
  const latest = sellerRows.at(-1) ?? {};
  return {
    seller,
    product_code: latest.product_code ?? null,
    product_name: latest.product_name_original ?? latest.product_name ?? null,
    currency_code: latest.currency_code ?? null,
    availability_label: latest.availability_label ?? null,
    stock_status_label: latest.stock_status_label ?? null,
    latest_price: latest.price_with_vat ?? latest.latest_price ?? null,
    previous_price: null,
    first_price: sellerRows[0]?.price_with_vat ?? latest.latest_price ?? null,
    list_price_with_vat: latest.list_price_with_vat ?? null,
    source_url: latest.source_url ?? null,
    latest_scraped_at: latest.scraped_at ?? latest.latest_scraped_at ?? null,
    hero_image_url: firstNonEmptyValue(sellerRows, "hero_image_url"),
    gallery_image_urls: firstNonEmptyValue(sellerRows, "gallery_image_urls") ?? [],
    short_description: firstNonEmptyValue(sellerRows, "short_description"),
    supplementary_parameters:
      firstNonEmptyValue(sellerRows, "supplementary_parameters") ?? [],
    metadata: latest.metadata ?? {},
    history: sellerRows.map((row) => ({
      price_date: row.price_date ?? row.scraped_at ?? "",
      price_with_vat: row.price_with_vat ?? row.latest_price ?? null,
      list_price_with_vat: row.list_price_with_vat ?? null,
      currency_code: row.currency_code ?? null,
      scraped_at: row.scraped_at ?? row.latest_scraped_at ?? "",
      snapshot_count: row.snapshot_count ?? 1,
    })),
  };
};

export const productDetailResponseFromRows = (rows: ProductFixtureRow[]) => {
  const slug = String(rows[0]?.product_name_normalized ?? "");
  const rowsBySeller = new Map<string, ProductFixtureRow[]>();
  rows.forEach((row) => {
    const seller = String(row.seller ?? "catalog");
    rowsBySeller.set(seller, [...(rowsBySeller.get(seller) ?? []), row]);
  });
  return {
    product_name_normalized: slug,
    sellers: Array.from(rowsBySeller, ([seller, sellerRows]) =>
      buildSellerFixture(sellerRows, seller)
    ),
  };
};

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
