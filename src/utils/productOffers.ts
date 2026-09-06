import type { ProductSeries, SellerSeries } from "../types/product";
import { getAvailabilityTone } from "./availability";

export const isSellerAvailable = (seller: SellerSeries): boolean =>
  getAvailabilityTone(seller.availabilityLabel) === "available";
const priceOrder = (left: SellerSeries, right: SellerSeries) =>
  (left.latestPrice ?? Infinity) - (right.latestPrice ?? Infinity);
export const currentOffers = (series: ProductSeries): SellerSeries[] =>
  series.sellers
    .filter((seller) => seller.latestPrice !== null)
    .sort(
      (left, right) =>
        Number(isSellerAvailable(right)) - Number(isSellerAvailable(left)) || priceOrder(left, right),
    );
export const lowestAvailableSeller = (series: ProductSeries): SellerSeries | null =>
  currentOffers(series).find(isSellerAvailable) ?? null;
export const latestOfferCheck = (series: ProductSeries): string | null =>
  series.sellers
    .map((seller) => seller.latestScrapedAt)
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
