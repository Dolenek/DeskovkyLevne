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

const FILTER_KEY_SEPARATOR = "\u001f";

const buildFilterKey = (values: string[]) =>
  values.filter(Boolean).sort().join(FILTER_KEY_SEPARATOR);

const parseFilterKey = <T extends string>(key: string) =>
  (key ? key.split(FILTER_KEY_SEPARATOR) : []) as T[];

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

  const categoryFilterKey = buildFilterKey(categoryFilters);
  const playerRangeFilterKey = buildFilterKey(playerRangeFilters);
  const playtimeRangeFilterKey = buildFilterKey(playtimeRangeFilters);
  const ageRatingFilterKey = buildFilterKey(ageRatingFilters);
  const normalizedCategories = useMemo(
    () => parseFilterKey<CategoryFilter>(categoryFilterKey),
    [categoryFilterKey]
  );
  const normalizedPlayers = useMemo(
    () => parseFilterKey<PlayerRangeFilter>(playerRangeFilterKey),
    [playerRangeFilterKey]
  );
  const normalizedPlaytimes = useMemo(
    () => parseFilterKey<PlaytimeRangeFilter>(playtimeRangeFilterKey),
    [playtimeRangeFilterKey]
  );
  const normalizedAges = useMemo(
    () => parseFilterKey<AgeRatingFilter>(ageRatingFilterKey),
    [ageRatingFilterKey]
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
