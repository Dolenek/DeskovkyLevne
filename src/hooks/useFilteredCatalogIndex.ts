import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AgeRatingFilter,
  AvailabilityFilter,
  CategoryFilter,
  PlayerRangeFilter,
  PlaytimeRangeFilter,
  PriceMovementFilter,
} from "../types/filters";
import type { ProductSeries } from "../types/product";
import { fetchFilteredCatalogIndex } from "../services/api/catalogApi";
import { buildSeriesFromCatalogIndexRow } from "../utils/catalogTransforms";

interface UseFilteredCatalogIndexOptions {
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

interface UseFilteredCatalogIndexResult {
  series: ProductSeries[];
  total: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useFilteredCatalogIndex = (
  options: UseFilteredCatalogIndexOptions
): UseFilteredCatalogIndexResult => {
  const {
    availabilityFilter,
    priceRange,
    page,
    pageSize,
    categoryFilters,
    playerRangeFilters,
    playtimeRangeFilters,
    ageRatingFilters,
    priceMovementFilter,
    randomSeed = null,
  } = options;
  const [series, setSeries] = useState<ProductSeries[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestRef = useRef(0);

  const normalizedCategories = useMemo(
    () => [...categoryFilters].sort(),
    [categoryFilters]
  );
  const normalizedPlayers = useMemo(
    () => [...playerRangeFilters].sort(),
    [playerRangeFilters]
  );
  const normalizedPlaytimes = useMemo(
    () => [...playtimeRangeFilters].sort(),
    [playtimeRangeFilters]
  );
  const normalizedAges = useMemo(
    () => [...ageRatingFilters].sort(),
    [ageRatingFilters]
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);

    const load = async () => {
      try {
        const offset = Math.max(0, (page - 1) * pageSize);
        const { rows, total } = await fetchFilteredCatalogIndex(offset, pageSize, {
          availability: availabilityFilter,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          categories: normalizedCategories,
          playerRanges: normalizedPlayers,
          playtimeRanges: normalizedPlaytimes,
          ageRatings: normalizedAges,
          priceMovement: priceMovementFilter,
          randomSeed,
        }, controller.signal);
        if (controller.signal.aborted || requestRef.current !== requestId) {
          return;
        }
        setSeries(rows.map((row) => buildSeriesFromCatalogIndexRow(row)));
        setTotal(total);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted || requestRef.current !== requestId) {
          return;
        }
        setSeries([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted && requestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [
    availabilityFilter,
    normalizedCategories,
    normalizedPlayers,
    normalizedPlaytimes,
    normalizedAges,
    page,
    pageSize,
    priceMovementFilter,
    priceRange.max,
    priceRange.min,
    randomSeed,
    reloadToken,
  ]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { series, total, loading, error, reload };
};
