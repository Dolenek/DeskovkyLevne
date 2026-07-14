import type { DiscountEntry, ProductRow } from "../../types/product";
import { ApiRequestError, buildApiUrl, fetchApi } from "./client";
import { filterRowsByCode } from "./helpers";
import { PRODUCT_HISTORY_POINTS, RECENT_DISCOUNT_LIMIT } from "./config";
import type {
  ProductDetailResponse,
  ProductHistoryPointResponse,
  ProductSellerResponse,
  RecentDiscountsResponse,
} from "./types";
import { sanitizeExternalHttpsUrl } from "../../utils/urls";

const toProductRow = (
  slug: string,
  seller: ProductSellerResponse,
  point: ProductHistoryPointResponse,
  id: number
): ProductRow => ({
  id,
  product_code: seller.product_code,
  product_name_original: seller.product_name,
  product_name_normalized: slug,
  price_with_vat: point.price_with_vat,
  list_price_with_vat: seller.list_price_with_vat,
  currency_code: seller.currency_code,
  source_url: seller.source_url,
  availability_label: seller.availability_label,
  stock_status_label: seller.stock_status_label,
  hero_image_url: seller.hero_image_url,
  gallery_image_urls: seller.gallery_image_urls,
  short_description: seller.short_description,
  scraped_at: point.scraped_at,
  price_date: point.price_date,
  snapshot_count: point.snapshot_count,
  supplementary_parameters: seller.supplementary_parameters,
  metadata: seller.metadata,
  seller: seller.seller,
  latest_price: seller.latest_price,
  previous_price: seller.previous_price,
  first_price: seller.first_price,
  latest_scraped_at: seller.latest_scraped_at,
});

const currentSellerPoint = (
  seller: ProductSellerResponse
): ProductHistoryPointResponse => ({
  price_date: seller.latest_scraped_at?.slice(0, 10) ?? "",
  price_with_vat: seller.latest_price,
  list_price_with_vat: seller.list_price_with_vat,
  currency_code: seller.currency_code,
  scraped_at: seller.latest_scraped_at ?? "",
  snapshot_count: 1,
});

const flattenProductDetail = (payload: ProductDetailResponse): ProductRow[] => {
  let rowID = 0;
  return payload.sellers.flatMap((seller) => {
    const points = seller.history.length > 0
      ? seller.history
      : [currentSellerPoint(seller)];
    return points.map((point) =>
      toProductRow(payload.product_name_normalized, seller, point, rowID++)
    );
  });
};

export const fetchProductDetailBySlug = async (
  productSlug: string,
  signal?: AbortSignal
): Promise<ProductRow[]> => {
  const normalizedSlug = productSlug.trim().toLowerCase();
  if (!normalizedSlug) {
    return [];
  }

	try {
		const payload = await fetchApi<ProductDetailResponse | { rows: ProductRow[] }>(
			buildApiUrl(`/products/${encodeURIComponent(normalizedSlug)}`, {
				history_points: PRODUCT_HISTORY_POINTS > 0 ? PRODUCT_HISTORY_POINTS : null,
			}),
			{ signal }
		);
		if ("rows" in payload) {
			return filterRowsByCode(payload.rows);
		}
		return filterRowsByCode(flattenProductDetail(payload));
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 404) {
			return [];
		}
		throw error;
	}
};

export const fetchRecentDiscounts = async (
  limit = RECENT_DISCOUNT_LIMIT,
  signal?: AbortSignal
): Promise<DiscountEntry[]> => {
  const payload = await fetchApi<RecentDiscountsResponse>(
    buildApiUrl("/discounts/recent", { limit }),
    { signal }
  );
  return payload.rows.flatMap((row) => {
    if (
      row.current_price === null ||
      row.reference_price === null ||
      !row.changed_at
    ) {
      return [];
    }
		return [{
			productSlug: row.product_name_normalized,
			seller: row.seller,
      productName: row.product_name ?? row.product_code ?? "Neznámý produkt",
      currency: row.currency_code,
			url: sanitizeExternalHttpsUrl(row.source_url),
      previousPrice: row.reference_price,
      currentPrice: row.current_price,
      changedAt: row.changed_at,
    }];
  });
};
