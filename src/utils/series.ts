import type { ProductSeries } from "../types/product";

export const uniqueSeriesBySlug = (
  seriesList: ProductSeries[]
): ProductSeries[] => {
  const seen = new Set<string>();
  const unique: ProductSeries[] = [];
  seriesList.forEach((series) => {
    if (seen.has(series.slug)) {
      return;
    }
    seen.add(series.slug);
    unique.push(series);
  });
  return unique;
};
