import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useCatalogSearch } from "../../hooks/useCatalogSearch";
import { useCategoryOptions } from "../../hooks/useCategoryOptions";
import { useCatalogPriceBounds } from "../../hooks/useCatalogPriceBounds";
import { useFilteredCatalogIndex } from "../../hooks/useFilteredCatalogIndex";
import type { AvailabilityFilter } from "../../types/filters";
import type { ProductSearchResult, ProductSeries } from "../../types/product";
import { uniqueSeriesBySlug } from "../../utils/series";
import { FILTERED_PAGE_SIZE } from "./FilteredProductsSection";

const parsePriceInput = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const buildPriceRange = (minValue: string, maxValue: string) => ({
  min: parsePriceInput(minValue),
  max: parsePriceInput(maxValue),
});

const filterSearchResultsByCategory = (
  rows: ProductSearchResult[],
  selectedCategories: string[]
) => {
  if (selectedCategories.length === 0) {
    return rows;
  }
  return rows.filter((series) =>
    selectedCategories.some((category) => series.categoryTags.includes(category))
  );
};

const filterCategoryOptionsByQuery = (
  categoryOptions: string[],
  categoryQuery: string
) => {
  const normalizedQuery = categoryQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return categoryOptions;
  }
  return categoryOptions.filter((category) =>
    category.toLowerCase().includes(normalizedQuery)
  );
};

interface SearchPageState {
  searchValue: string;
  searchActive: boolean;
  filtersOpen: boolean;
  availabilityFilter: AvailabilityFilter;
  selectedSeries: ProductSeries | null;
  priceFilter: { min: string; max: string };
  priceRange: { min: number | null; max: number | null };
  pricePage: number;
  categoryFilters: string[];
  categorySearch: string;
  filteredCategoryOptions: string[];
  categoryOptions: string[];
  priceBounds: { min: number; max: number };
  visibleSeries: ProductSearchResult[];
  overlayVisible: boolean;
  debouncedQuery: string;
  searchLoading: boolean;
  searchError: string | null;
  reloadSearch: () => void;
  filteredSeries: ProductSeries[];
  filteredTotal: number;
  filteredLoading: boolean;
  filteredError: string | null;
  reloadFiltered: () => void;
  setFiltersOpen: (open: boolean) => void;
  setAvailabilityFilter: (value: AvailabilityFilter) => void;
  setSelectedSeries: (series: ProductSeries | null) => void;
  setPricePage: (page: number) => void;
  setCategorySearch: (value: string) => void;
  setSearchActive: (active: boolean) => void;
  handleSearchChange: (value: string) => void;
  handlePriceFilterChange: (key: "min" | "max", value: string) => void;
  handleSliderChange: (key: "min" | "max", numericValue: number) => void;
  handleCategoryToggle: (category: string) => void;
}

export const useSearchPageState = (
  maxSearchSeries: number,
  overlaySearchLimit: number
): SearchPageState => {
  const [searchValue, setSearchValue] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [selectedSeries, setSelectedSeries] = useState<ProductSeries | null>(null);
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [pricePage, setPricePage] = useState(1);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();
  const priceRange = useMemo(
    () => buildPriceRange(priceFilter.min, priceFilter.max),
    [priceFilter.max, priceFilter.min]
  );

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    reload: reloadSearch,
  } = useCatalogSearch({
    query: debouncedQuery,
    availabilityFilter,
    limit: overlaySearchLimit,
  });

  const {
    series: filteredSeries,
    total: filteredTotal,
    loading: filteredLoading,
    error: filteredError,
    reload: reloadFiltered,
  } = useFilteredCatalogIndex({
    priceRange,
    availabilityFilter,
    categoryFilters,
    page: pricePage,
    pageSize: FILTERED_PAGE_SIZE,
  });

  const { categories: categoryOptions } = useCategoryOptions(availabilityFilter);
  const { bounds: priceBounds } = useCatalogPriceBounds(
    availabilityFilter,
    categoryFilters
  );

  useEffect(() => {
    setPricePage(1);
  }, [availabilityFilter, categoryFilters]);

  useEffect(() => {
    setCategoryFilters((current) => {
      const filtered = current.filter((category) =>
        categoryOptions.includes(category)
      );
      return filtered.length === current.length ? current : filtered;
    });
  }, [categoryOptions]);

  const filteredSearchSeries = useMemo(
    () => filterSearchResultsByCategory(searchResults, categoryFilters),
    [categoryFilters, searchResults]
  );

  const visibleSeries = useMemo(() => {
    const uniqueSeries = uniqueSeriesBySlug(filteredSearchSeries);
    return uniqueSeries.slice(0, maxSearchSeries);
  }, [filteredSearchSeries, maxSearchSeries]);

  const filteredCategoryOptions = useMemo(
    () => filterCategoryOptionsByQuery(categoryOptions, categorySearch),
    [categoryOptions, categorySearch]
  );

  const handlePriceFilterChange = useCallback((key: "min" | "max", value: string) => {
    setPriceFilter((current) => ({ ...current, [key]: value }));
    setPricePage(1);
  }, []);

  const handleSliderChange = useCallback((key: "min" | "max", numericValue: number) => {
    const roundedValue = Math.max(0, Math.round(numericValue));
    setPriceFilter((current) => ({
      ...current,
      [key]: roundedValue.toString(),
    }));
    setPricePage(1);
  }, []);

  const handleCategoryToggle = useCallback((category: string) => {
    setCategoryFilters((current) => {
      if (current.includes(category)) {
        return current.filter((entry) => entry !== category);
      }
      return [...current, category];
    });
    setPricePage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setSearchActive(Boolean(value.trim()));
  }, []);

  return {
    searchValue,
    searchActive,
    filtersOpen,
    availabilityFilter,
    selectedSeries,
    priceFilter,
    priceRange,
    pricePage,
    categoryFilters,
    categorySearch,
    filteredCategoryOptions,
    categoryOptions,
    priceBounds,
    visibleSeries,
    overlayVisible: searchActive && debouncedQuery.length >= 2,
    debouncedQuery,
    searchLoading,
    searchError,
    reloadSearch,
    filteredSeries,
    filteredTotal,
    filteredLoading,
    filteredError,
    reloadFiltered,
    setFiltersOpen,
    setAvailabilityFilter,
    setSelectedSeries,
    setPricePage,
    setCategorySearch,
    setSearchActive,
    handleSearchChange,
    handlePriceFilterChange,
    handleSliderChange,
    handleCategoryToggle,
  };
};
