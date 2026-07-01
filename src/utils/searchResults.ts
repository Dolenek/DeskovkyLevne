import type { ProductSearchResult } from "../types/product";
import { getAvailabilityTone } from "./availability";

const isAvailableSearchResult = (series: ProductSearchResult) =>
  getAvailabilityTone(series.availabilityLabel) === "available";

export const sortSearchResultsByAvailability = (
  results: ProductSearchResult[]
): ProductSearchResult[] => [
  ...results.filter(isAvailableSearchResult),
  ...results.filter((series) => !isAvailableSearchResult(series)),
];
