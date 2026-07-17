import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
  ProductDetailResponse,
  ProductSellerResponse,
} from "../../src/services/api/types";

vi.mock("../../src/services/api/client", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../src/services/api/client")
  >();
  return { ...actual, fetchApi: vi.fn() };
});

import {
  ApiRequestError,
  fetchApi,
} from "../../src/services/api/client";
import { fetchProductDetailBySlug } from "../../src/services/api/snapshotApi";

const fetchApiMock = vi.mocked(fetchApi);

const sellerResponse = (
  overrides: Partial<ProductSellerResponse>
): ProductSellerResponse => ({
  seller: "other-shop",
  product_code: "CODE-1",
  product_name: "Alpha Game",
  currency_code: "CZK",
  availability_label: "Skladem",
  stock_status_label: null,
  latest_price: 599,
  previous_price: 699,
  first_price: 799,
  list_price_with_vat: 899,
  source_url: "https://shop.test/alpha",
  latest_scraped_at: "2026-07-17T18:30:00Z",
  hero_image_url: "https://shop.test/alpha.jpg",
  gallery_image_urls: [],
  short_description: null,
  supplementary_parameters: [],
  metadata: {},
  history: [],
  ...overrides,
});

describe("product snapshot API", () => {
  beforeEach(() => {
    fetchApiMock.mockReset();
  });

  test("normalizes and safely encodes the requested slug", async () => {
    fetchApiMock.mockResolvedValue({
      product_name_normalized: "fancy/game",
      sellers: [],
    });

    await fetchProductDetailBySlug("  Fancy/Game  ");

    const requestedURL = String(fetchApiMock.mock.calls[0]?.[0]);
    expect(requestedURL).toContain("/api/v1/products/fancy%2Fgame");
  });

  test("keeps seller histories separate under the canonical slug", async () => {
    const payload: ProductDetailResponse = {
      product_name_normalized: "canonical-alpha",
      sellers: [
        sellerResponse({
          seller: "tlamagames",
          product_code: "TLAMA-1",
          history: [
            {
              price_date: "2026-07-16",
              price_with_vat: 649,
              list_price_with_vat: 899,
              currency_code: "CZK",
              scraped_at: "2026-07-16T12:00:00Z",
              snapshot_count: 2,
            },
            {
              price_date: "2026-07-17",
              price_with_vat: 599,
              list_price_with_vat: 899,
              currency_code: "CZK",
              scraped_at: "2026-07-17T12:00:00Z",
              snapshot_count: 3,
            },
          ],
        }),
        sellerResponse({
          seller: "planetaher",
          product_code: "PLANETA-1",
          history: [
            {
              price_date: "2026-07-17",
              price_with_vat: 579,
              list_price_with_vat: 799,
              currency_code: "CZK",
              scraped_at: "2026-07-17T13:00:00Z",
              snapshot_count: 1,
            },
          ],
        }),
      ],
    };
    fetchApiMock.mockResolvedValue(payload);

    const rows = await fetchProductDetailBySlug("alias-alpha");

    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((row) => row.seller))).toEqual(
      new Set(["tlamagames", "planetaher"])
    );
    expect(rows.every((row) => row.product_name_normalized === "canonical-alpha")).toBe(
      true
    );
    expect(rows.map((row) => row.id)).toEqual([0, 1, 2]);
  });

  test("creates a current row for empty history without inventing a price", async () => {
    fetchApiMock.mockResolvedValue({
      product_name_normalized: "alpha",
      sellers: [sellerResponse({ history: [], latest_price: null })],
    });

    const rows = await fetchProductDetailBySlug("alpha");

    expect(rows).toHaveLength(1);
    expect(rows[0]?.price_with_vat).toBeNull();
    expect(rows[0]?.latest_price).toBeNull();
    expect(rows[0]?.price_date).toBe("2026-07-17");
  });

  test("maps 404 to an empty result and propagates other failures", async () => {
    fetchApiMock.mockRejectedValueOnce(new ApiRequestError(404));
    await expect(fetchProductDetailBySlug("missing")).resolves.toEqual([]);

    fetchApiMock.mockRejectedValueOnce(new ApiRequestError(503));
    await expect(fetchProductDetailBySlug("broken")).rejects.toMatchObject({
      status: 503,
    });
  });

  test("returns early for an empty slug", async () => {
    await expect(fetchProductDetailBySlug("   ")).resolves.toEqual([]);
    expect(fetchApiMock).not.toHaveBeenCalled();
  });
});
