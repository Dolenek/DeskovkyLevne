import { useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useCatalogSearch } from "../../hooks/useCatalogSearch";
import { useFilteredCatalogIndex } from "../../hooks/useFilteredCatalogIndex";
import type { Translator } from "../../types/i18n";
import { uniqueSeriesBySlug } from "../../utils/series";
import { sortSearchResultsByAvailability } from "../../utils/searchResults";
import { FILTERED_PAGE_SIZE } from "./FilteredProductsSection";
import { useCatalogSelection } from "./useCatalogSelection";

const useCatalogResults = (query: string, selection: ReturnType<typeof useCatalogSelection>) => {
  const result = useFilteredCatalogIndex({
    ...selection,
    query,
    page: selection.pricePage,
    pageSize: FILTERED_PAGE_SIZE,
  });
  return {
    filteredSeries: result.series,
    filteredTotal: result.total,
    filteredLoading: result.loading,
    filteredError: result.error,
    reloadFiltered: result.reload,
  };
};

export const useSearchPageState = (
  maxSearchSeries: number,
  overlaySearchLimit: number,
  t: Translator,
  query: string,
) => {
  const selection = useCatalogSelection(query, t);
  const results = useCatalogResults(query, selection);
  const [searchValue, setSearchValue] = useState(query);
  const [searchActive, setSearchActive] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();
  const suggestions = useCatalogSearch({
    query: debouncedQuery,
    availabilityFilter: "all",
    limit: overlaySearchLimit,
  });
  const visibleSeries = sortSearchResultsByAvailability(uniqueSeriesBySlug(suggestions.results)).slice(
    0,
    maxSearchSeries,
  );
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setSearchActive(Boolean(value.trim()));
  };
  return {
    ...selection,
    ...results,
    searchValue,
    searchActive,
    filtersOpen,
    setFiltersOpen,
    setSearchActive,
    handleSearchChange,
    visibleSeries,
    debouncedQuery,
    overlayVisible: searchActive && debouncedQuery.length >= 2,
    searchLoading: suggestions.loading,
    searchError: suggestions.error,
    reloadSearch: suggestions.reload,
  };
};
