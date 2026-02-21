import { useCallback, useEffect, useState } from "react";
import type { AvailabilityFilter } from "../types/filters";
import { fetchCategoryCounts } from "../services/api/catalogApi";

interface UseCategoryOptionsResult {
  categories: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useCategoryOptions = (
  availabilityFilter: AvailabilityFilter
): UseCategoryOptionsResult => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const load = async () => {
      try {
        const rows = await fetchCategoryCounts(
          availabilityFilter,
          controller.signal
        );
        setCategories(
          rows
            .map((row) => row.category)
            .filter(Boolean)
            .sort((left, right) => left.localeCompare(right, "cs"))
        );
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
  }, [availabilityFilter, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { categories, loading, error, reload };
};
