import type { ProductSearchResult } from "../types/product";
import { getAvailabilityTone } from "./availability";

const isAvailableSearchResult = (series: ProductSearchResult) =>
  getAvailabilityTone(series.availabilityLabel) === "available";

export const sortSearchResultsByAvailability = (
  results: ProductSearchResult[]
): ProductSearchResult[] =>
  results
    .map((series, index) => ({ series, index }))
    .sort((left, right) => {
      const availabilityDiff =
        Number(isAvailableSearchResult(right.series)) -
        Number(isAvailableSearchResult(left.series));
      if (availabilityDiff !== 0) return availabilityDiff;
      const sellerDiff =
        (right.series.sellerCount ?? 1) - (left.series.sellerCount ?? 1);
      if (sellerDiff !== 0) return sellerDiff;
      return left.index - right.index;
    })
    .map((entry) => entry.series);
