import { useCallback, useEffect, useState } from "react";
import { fetchFilterOptions } from "../services/api/catalogApi";
import type { FilterOptionsResponse } from "../services/api/types";

const STATIC_FILTER_OPTIONS: FilterOptionsResponse = {
  categories: [
    { value: "strategicka", label: "Strategická" },
    { value: "rodinna", label: "Rodinná" },
    { value: "fantasy", label: "Fantasy" },
    { value: "kooperativni", label: "Kooperativní" },
    { value: "ekonomicka", label: "Ekonomická" },
  ],
  player_ranges: [
    { value: "1-2", label: "1-2" },
    { value: "2-4", label: "2-4" },
    { value: "4-plus", label: "4+" },
  ],
  playtime_ranges: [
    { value: "under-30", label: "do 30 min" },
    { value: "30-60", label: "30-60 min" },
    { value: "60-plus", label: "60+ min" },
  ],
  age_ratings: [
    { value: "6", label: "6+" },
    { value: "8", label: "8+" },
    { value: "10", label: "10+" },
    { value: "12", label: "12+" },
  ],
  availability: [
    { value: "available", label: "Skladem" },
    { value: "preorder", label: "Předobjednávka" },
  ],
  price_movement: [{ value: "decreased", label: "Ve slevě" }],
};

const withStaticFallbacks = (
  payload: Partial<FilterOptionsResponse>
): FilterOptionsResponse => {
  return {
    categories: payload.categories?.length
      ? payload.categories
      : STATIC_FILTER_OPTIONS.categories,
    player_ranges: payload.player_ranges?.length
      ? payload.player_ranges
      : STATIC_FILTER_OPTIONS.player_ranges,
    playtime_ranges: payload.playtime_ranges?.length
      ? payload.playtime_ranges
      : STATIC_FILTER_OPTIONS.playtime_ranges,
    age_ratings: payload.age_ratings?.length
      ? payload.age_ratings
      : STATIC_FILTER_OPTIONS.age_ratings,
    availability: payload.availability?.length
      ? payload.availability
      : STATIC_FILTER_OPTIONS.availability,
    price_movement: payload.price_movement?.length
      ? payload.price_movement
      : STATIC_FILTER_OPTIONS.price_movement,
  };
};

interface UseFilterOptionsResult {
  options: FilterOptionsResponse;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useFilterOptions = (): UseFilterOptionsResult => {
  const [options, setOptions] = useState<FilterOptionsResponse>(STATIC_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const load = async () => {
      try {
        const payload = await fetchFilterOptions(controller.signal);
        setOptions(withStaticFallbacks(payload));
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setOptions(STATIC_FILTER_OPTIONS);
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
