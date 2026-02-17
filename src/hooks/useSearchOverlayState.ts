import { useMemo, useState } from "react";
import { useCatalogSearch } from "./useCatalogSearch";
import { useDebouncedValue } from "./useDebouncedValue";
import { uniqueSeriesBySlug } from "../utils/series";
import type { ProductSearchResult } from "../types/product";

interface UseSearchOverlayStateResult {
  searchValue: string;
  setSearchValue: (value: string) => void;
  setSearchActive: (value: boolean) => void;
  overlayVisible: boolean;
  overlayResults: ProductSearchResult[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  debouncedQuery: string;
}

export const useSearchOverlayState = (
  limit: number
): UseSearchOverlayStateResult => {
  const [searchValue, setSearchValue] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();
  const { results, loading, error, reload } = useCatalogSearch({
    query: debouncedQuery,
    availabilityFilter: "all",
    limit: limit * 6,
  });
  const overlayResults = useMemo(
    () => uniqueSeriesBySlug(results).slice(0, limit),
    [limit, results]
  );
  const overlayVisible = searchActive && debouncedQuery.length >= 2;

  return {
    searchValue,
    setSearchValue,
    setSearchActive,
    overlayVisible,
    overlayResults,
    loading,
    error,
    reload,
    debouncedQuery,
  };
};
