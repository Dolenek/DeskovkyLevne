import { useMemo, useState } from "react";
import { useCatalogSearch } from "./useCatalogSearch";
import { useDebouncedValue } from "./useDebouncedValue";
import { uniqueSeriesBySlug } from "../utils/series";
import { sortSearchResultsByAvailability } from "../utils/searchResults";
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
  candidateLimit: number
): UseSearchOverlayStateResult => {
  const [searchValue, setSearchValue] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();
  const { results, loading, error, reload } = useCatalogSearch({
    query: debouncedQuery,
    availabilityFilter: "all",
    limit: candidateLimit,
  });
  const overlayResults = useMemo(
    () => sortSearchResultsByAvailability(uniqueSeriesBySlug(results)).slice(0, candidateLimit),
    [candidateLimit, results]
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
