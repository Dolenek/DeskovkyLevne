import type { ProductSeries, SellerSeries } from "../types/product";

export const collectSellerPrices = (series: ProductSeries): number[] =>
  series.sellers.flatMap((seller) =>
    seller.points.map((point) => point.price).filter(Number.isFinite)
  );

export const getLatestComparablePrice = (
  seller: SellerSeries
): number | null => seller.latestPrice;

export const getDiscountPercent = (
  current: number | null,
  reference: number | null
): number | null => {
  if (current === null || reference === null || reference <= current) {
    return null;
  }
  return Math.round(((reference - current) / reference) * 100);
};

export const getSeriesDiscountPercent = (series: ProductSeries): number | null =>
  getDiscountPercent(
    series.latestPrice,
    series.listPrice ?? series.previousPrice ?? series.firstPrice
  );

export const getLowestSeller = (series: ProductSeries): SellerSeries | null => {
  const sellers = series.sellers
    .filter((seller) => getLatestComparablePrice(seller) !== null)
    .sort(
      (a, b) =>
        (getLatestComparablePrice(a) ?? Number.POSITIVE_INFINITY) -
        (getLatestComparablePrice(b) ?? Number.POSITIVE_INFINITY)
    );
  return sellers[0] ?? null;
};

export const getPriceStats = (series: ProductSeries) => {
  const prices = collectSellerPrices(series);
  const minimum = prices.length > 0 ? Math.min(...prices) : null;
  const maximum = prices.length > 0 ? Math.max(...prices) : null;
  const average =
    prices.length > 0
      ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
      : null;
  return { minimum, maximum, average };
};
