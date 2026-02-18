import { useCallback, useEffect, useMemo, useState } from "react";
import type { AvailabilityFilter } from "../types/filters";
import { fetchCatalogPriceRange } from "../services/productService";

const FALLBACK_BOUNDS = { min: 0, max: 1000 };

interface UseCatalogPriceBoundsResult {
  bounds: { min: number; max: number };
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useCatalogPriceBounds = (
  availabilityFilter: AvailabilityFilter,
  categoryFilters: string[]
): UseCatalogPriceBoundsResult => {
  const normalizedCategories = useMemo(
    () => [...categoryFilters].sort(),
    [categoryFilters]
  );
  const [rawBounds, setRawBounds] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const load = async () => {
      try {
        const row = await fetchCatalogPriceRange(
          availabilityFilter,
          normalizedCategories,
          controller.signal
        );
        setRawBounds({ min: row.min_price, max: row.max_price });
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [availabilityFilter, normalizedCategories, reloadToken]);

  const bounds = useMemo(() => {
    if (rawBounds.min === null || rawBounds.max === null) {
      return FALLBACK_BOUNDS;
    }
    const min = Math.floor(rawBounds.min);
    if (rawBounds.min === rawBounds.max) {
      return { min, max: Math.ceil(rawBounds.max + 100) };
    }
    return { min, max: Math.ceil(rawBounds.max) };
  }, [rawBounds.max, rawBounds.min]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { bounds, loading, error, reload };
};
