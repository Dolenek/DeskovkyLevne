import { useCallback, useEffect, useState } from "react";
import { fetchFilterOptions } from "../services/api/catalogApi";
import type { FilterOptionsResponse } from "../services/api/types";

const EMPTY_OPTIONS: FilterOptionsResponse = {
  categories: [],
  player_ranges: [],
  playtime_ranges: [],
  age_ratings: [],
  availability: [],
  price_movement: [],
};

interface UseFilterOptionsResult {
  options: FilterOptionsResponse;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useFilterOptions = (): UseFilterOptionsResult => {
  const [options, setOptions] = useState<FilterOptionsResponse>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const load = async () => {
      try {
        const payload = await fetchFilterOptions(controller.signal);
        setOptions(payload);
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
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { options, loading, error, reload };
};
