import type { ProductSeries } from "../../types/product";
import type { AvailabilityFilter } from "../../types/filters";

const normalizeLabel = (value?: string | null) => value?.toLowerCase() ?? "";

const includesAvailabilityKeyword = (series: ProductSeries, keyword: string) =>
  normalizeLabel(series.availabilityLabel).includes(keyword);

export const isSeriesAvailable = (series: ProductSeries) =>
  includesAvailabilityKeyword(series, "sklad");

export const isSeriesPreorder = (series: ProductSeries) =>
  includesAvailabilityKeyword(series, "předprodej");

export const matchesAvailabilityFilter = (
  series: ProductSeries,
  filter: AvailabilityFilter
) => {
  if (filter === "available") {
    return isSeriesAvailable(series);
  }
  if (filter === "preorder") {
    return isSeriesPreorder(series);
  }
  return true;
};
