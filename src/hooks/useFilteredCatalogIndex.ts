import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AvailabilityFilter } from "../types/filters";
import type { ProductSeries } from "../types/product";
import { fetchFilteredCatalogIndex } from "../services/productService";
import { buildSeriesFromCatalogIndexRow } from "../utils/catalogTransforms";

interface UseFilteredCatalogIndexOptions {
  priceRange: { min: number | null; max: number | null };
  availabilityFilter: AvailabilityFilter;
  categoryFilters: string[];
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
  const { availabilityFilter, priceRange, page, pageSize, categoryFilters } = options;
  const [series, setSeries] = useState<ProductSeries[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestRef = useRef(0);

  const normalizedCategories = useMemo(
    () => categoryFilters.map((category) => category.trim()).filter(Boolean).sort(),
    [categoryFilters]
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
    page,
    pageSize,
    priceRange.max,
    priceRange.min,
    reloadToken,
  ]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { series, total, loading, error, reload };
};
