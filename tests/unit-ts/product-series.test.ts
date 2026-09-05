import { describe, expect, test } from "vitest";
import type { ProductRow } from "../../src/types/product";
import { buildProductSeries } from "../../src/utils/productSeries/buildProductSeries";

const productRow = (overrides: Partial<ProductRow>): ProductRow => ({
  id: 1,
  product_code: "CODE-1",
  product_name_original: "Alpha Game",
  product_name_normalized: "canonical-alpha",
  price_with_vat: 599,
  list_price_with_vat: 899,
  currency_code: "CZK",
  source_url: "https://shop.test/alpha",
  availability_label: "Skladem",
  stock_status_label: null,
  hero_image_url: null,
  gallery_image_urls: [],
  short_description: null,
  scraped_at: "2026-07-17T12:00:00Z",
  price_date: "2026-07-17",
  seller: "other-shop",
  latest_price: 599,
  previous_price: 699,
  first_price: 799,
  latest_scraped_at: "2026-07-17T12:00:00Z",
  ...overrides,
});

describe("product series regressions", () => {
  test("keeps current offers and presentation when a seller has no chart points", () => {
    const [series] = buildProductSeries([
      productRow({
        seller: "tlamagames",
        price_with_vat: null,
        price_date: null,
        scraped_at: "",
        latest_scraped_at: null,
        latest_price: 0,
        hero_image_url: "https://img.test/tlama.jpg",
      }),
      productRow({ seller: "planetaher" }),
    ]);

    expect(series?.primarySeller).toBe("tlamagames");
    expect(series?.heroImage).toBe("https://img.test/tlama.jpg");
    expect(series?.sellerCount).toBe(2);
    expect(series?.sellers[0]?.latestPrice).toBe(0);
    expect(series?.sellers[0]?.points).toEqual([]);
    expect(series?.sellers[1]?.points).toHaveLength(1);
  });

  test("keeps a known product without prices instead of treating it as missing", () => {
    const [series] = buildProductSeries([
      productRow({ price_with_vat: null, latest_price: null }),
    ]);

    expect(series?.slug).toBe("canonical-alpha");
    expect(series?.latestPrice).toBeNull();
    expect(series?.sellers).toHaveLength(1);
    expect(series?.points).toEqual([]);
  });

  test("preserves seller series and applies TLAMA presentation priority", () => {
    const rows = [
      productRow({
        id: 1,
        seller: "planetaher",
        product_code: "PLANETA-1",
        price_with_vat: 579,
        latest_price: 579,
        hero_image_url: "https://img.test/fallback.jpg",
        short_description: "Fallback description",
      }),
      productRow({
        id: 2,
        seller: "tlamagames",
        product_code: "TLAMA-1",
        price_with_vat: 599,
        latest_price: null,
        hero_image_url: null,
        short_description: null,
      }),
    ];

    const [series] = buildProductSeries(rows);

    expect(series?.slug).toBe("canonical-alpha");
    expect(series?.primarySeller).toBe("tlamagames");
    expect(series?.sellers.map((seller) => seller.seller)).toEqual([
      "tlamagames",
      "planetaher",
    ]);
    expect(series?.sellers).toHaveLength(2);
    expect(series?.latestPrice).toBeNull();
    expect(series?.heroImage).toBe("https://img.test/fallback.jpg");
    expect(series?.shortDescription).toBe("Fallback description");
    expect(series?.sellers[0]?.points).toEqual([
      { rawDate: "2026-07-17", price: 599 },
    ]);
    expect(series?.sellers[1]?.points).toEqual([
      { rawDate: "2026-07-17", price: 579 },
    ]);
  });

  test("deduplicates dates only within each seller", () => {
    const rows = [
      productRow({ id: 1, seller: "tlamagames", price_with_vat: 700 }),
      productRow({ id: 2, seller: "tlamagames", price_with_vat: 650 }),
      productRow({ id: 3, seller: "planetaher", price_with_vat: 600 }),
    ];

    const [series] = buildProductSeries(rows);

    expect(series?.sellers[0]?.points).toHaveLength(1);
    expect(series?.sellers[1]?.points).toHaveLength(1);
    expect(series?.sellerCount).toBe(2);
  });
});
