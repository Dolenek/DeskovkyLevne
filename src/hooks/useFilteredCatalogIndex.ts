import { useMemo } from "react";
import type { AgeRatingFilter, AvailabilityFilter, CatalogSort, CategoryFilter,
  PlayerRangeFilter, PlaytimeRangeFilter, PriceMovementFilter } from "../types/filters";
import type { ProductSeries } from "../types/product";
import { fetchFilteredCatalogIndex } from "../services/api/catalogApi";
import { buildSeriesFromCatalogIndexRow } from "../utils/catalogTransforms";
import { useAsyncResource } from "./useAsyncResource";

interface UseFilteredCatalogIndexOptions {
  sort?: CatalogSort;
  query?: string;
  priceRange: { min: number | null; max: number | null };
  availabilityFilter: AvailabilityFilter;
  categoryFilters: CategoryFilter[];
  playerRangeFilters: PlayerRangeFilter[];
  playtimeRangeFilters: PlaytimeRangeFilter[];
  ageRatingFilters: AgeRatingFilter[];
  priceMovementFilter: PriceMovementFilter | null;
  randomSeed?: number | null;
  page: number;
  pageSize: number;
}

const EMPTY_CATALOG: { series: ProductSeries[]; total: number } = { series: [], total: 0 };
const normalizeFilters = <T extends string>(filters: T[]) => filters.filter(Boolean).sort();
const catalogRequestKey = (options: UseFilteredCatalogIndexOptions) => JSON.stringify({
  query: options.query ?? "", sort: options.sort ?? "name",
  availabilityFilter: options.availabilityFilter,
  priceRange: { min: options.priceRange.min, max: options.priceRange.max },
  priceMovementFilter: options.priceMovementFilter,
  page: options.page, pageSize: options.pageSize,
  randomSeed: options.randomSeed ?? null,
  categoryFilters: normalizeFilters(options.categoryFilters),
  playerRangeFilters: normalizeFilters(options.playerRangeFilters),
  playtimeRangeFilters: normalizeFilters(options.playtimeRangeFilters),
  ageRatingFilters: normalizeFilters(options.ageRatingFilters),
});

const createCatalogLoader = (requestKey: string) => {
  const options: UseFilteredCatalogIndexOptions = JSON.parse(requestKey);
  return async (signal: AbortSignal) => {
    const { rows, total } = await fetchFilteredCatalogIndex(
      Math.max(0, (options.page - 1) * options.pageSize), options.pageSize, {
        query: options.query, sort: options.sort, availability: options.availabilityFilter,
        minPrice: options.priceRange.min, maxPrice: options.priceRange.max,
        categories: options.categoryFilters, playerRanges: options.playerRangeFilters,
        playtimeRanges: options.playtimeRangeFilters, ageRatings: options.ageRatingFilters,
        priceMovement: options.priceMovementFilter, randomSeed: options.randomSeed,
      }, signal,
    );
    return { series: rows.map(buildSeriesFromCatalogIndexRow), total };
  };
};

export const useFilteredCatalogIndex = (options: UseFilteredCatalogIndexOptions) => {
  const requestKey = catalogRequestKey(options);
  const loader = useMemo(() => createCatalogLoader(requestKey), [requestKey]);
  const { value, loading, error, reload } = useAsyncResource(loader, EMPTY_CATALOG);
  return { ...value, loading, error, reload };
};
