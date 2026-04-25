import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useCatalogSearch } from "../../hooks/useCatalogSearch";
import { useCatalogPriceBounds } from "../../hooks/useCatalogPriceBounds";
import { useFilterOptions } from "../../hooks/useFilterOptions";
import { useFilteredCatalogIndex } from "../../hooks/useFilteredCatalogIndex";
import type {
  AgeRatingFilter,
  AvailabilityFilter,
  CategoryFilter,
  PlayerRangeFilter,
  PlaytimeRangeFilter,
  PriceMovementFilter,
} from "../../types/filters";
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
  selectedCategories: CategoryFilter[]
) => {
  if (selectedCategories.length === 0) {
    return rows;
  }
  const categoryLabels: Record<CategoryFilter, string[]> = {
    strategicka: ["Strategická"],
    rodinna: ["Rodinná"],
    fantasy: ["Fantasy"],
    kooperativni: ["Kooperativní", "Cooperative Game"],
    ekonomicka: ["Ekonomické"],
  };
  return rows.filter((series) =>
    selectedCategories.some((category) =>
      categoryLabels[category].some((label) => series.categoryTags.includes(label))
    )
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
  categoryFilters: CategoryFilter[];
  playerRangeFilters: PlayerRangeFilter[];
  playtimeRangeFilters: PlaytimeRangeFilter[];
  ageRatingFilters: AgeRatingFilter[];
  priceMovementFilter: PriceMovementFilter | null;
  filterOptions: ReturnType<typeof useFilterOptions>["options"];
  priceBounds: { min: number; max: number };
  activeFilterCount: number;
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
  setSearchActive: (active: boolean) => void;
  handleSearchChange: (value: string) => void;
  handlePriceFilterChange: (key: "min" | "max", value: string) => void;
  handleSliderChange: (key: "min" | "max", numericValue: number) => void;
  handleCategoryToggle: (category: CategoryFilter) => void;
  handlePlayerRangeToggle: (range: PlayerRangeFilter) => void;
  handlePlaytimeRangeToggle: (range: PlaytimeRangeFilter) => void;
  handleAgeRatingToggle: (age: AgeRatingFilter) => void;
  handleSaleToggle: () => void;
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
  const [priceFilter, setPriceFilter] = useState({ min: "200", max: "1500" });
  const [pricePage, setPricePage] = useState(1);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [playerRangeFilters, setPlayerRangeFilters] = useState<PlayerRangeFilter[]>([]);
  const [playtimeRangeFilters, setPlaytimeRangeFilters] = useState<PlaytimeRangeFilter[]>([]);
  const [ageRatingFilters, setAgeRatingFilters] = useState<AgeRatingFilter[]>([]);
  const [priceMovementFilter, setPriceMovementFilter] = useState<PriceMovementFilter | null>(null);

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
    playerRangeFilters,
    playtimeRangeFilters,
    ageRatingFilters,
    priceMovementFilter,
    page: pricePage,
    pageSize: FILTERED_PAGE_SIZE,
  });

  const { options: filterOptions } = useFilterOptions();
  const { bounds: priceBounds } = useCatalogPriceBounds(
    availabilityFilter,
    categoryFilters,
    playerRangeFilters,
    playtimeRangeFilters,
    ageRatingFilters,
    priceMovementFilter
  );

  useEffect(() => {
    setPricePage(1);
  }, [
    availabilityFilter,
    categoryFilters,
    playerRangeFilters,
    playtimeRangeFilters,
    ageRatingFilters,
    priceMovementFilter,
  ]);

  const filteredSearchSeries = useMemo(
    () => filterSearchResultsByCategory(searchResults, categoryFilters),
    [categoryFilters, searchResults]
  );

  const visibleSeries = useMemo(() => {
    const uniqueSeries = uniqueSeriesBySlug(filteredSearchSeries);
    return uniqueSeries.slice(0, maxSearchSeries);
  }, [filteredSearchSeries, maxSearchSeries]);

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

  const toggleValue = useCallback(<T extends string>(
    setValues: Dispatch<SetStateAction<T[]>>,
    value: T
  ) => {
    setValues((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
    setPricePage(1);
  }, []);

  const handleCategoryToggle = useCallback((category: CategoryFilter) => {
    toggleValue(setCategoryFilters, category);
  }, [toggleValue]);

  const handlePlayerRangeToggle = useCallback((range: PlayerRangeFilter) => {
    toggleValue(setPlayerRangeFilters, range);
  }, [toggleValue]);

  const handlePlaytimeRangeToggle = useCallback((range: PlaytimeRangeFilter) => {
    toggleValue(setPlaytimeRangeFilters, range);
  }, [toggleValue]);

  const handleAgeRatingToggle = useCallback((age: AgeRatingFilter) => {
    toggleValue(setAgeRatingFilters, age);
  }, [toggleValue]);

  const handleSaleToggle = useCallback(() => {
    setPriceMovementFilter((current) => (current === "decreased" ? null : "decreased"));
    setPricePage(1);
  }, []);

  const activeFilterCount = useMemo(
    () =>
      categoryFilters.length +
      playerRangeFilters.length +
      playtimeRangeFilters.length +
      ageRatingFilters.length +
      (availabilityFilter !== "all" ? 1 : 0) +
      (priceMovementFilter ? 1 : 0),
    [
      ageRatingFilters.length,
      availabilityFilter,
      categoryFilters.length,
      playerRangeFilters.length,
      playtimeRangeFilters.length,
      priceMovementFilter,
    ]
  );

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
    playerRangeFilters,
    playtimeRangeFilters,
    ageRatingFilters,
    priceMovementFilter,
    filterOptions,
    priceBounds,
    activeFilterCount,
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
    setSearchActive,
    handleSearchChange,
    handlePriceFilterChange,
    handleSliderChange,
    handleCategoryToggle,
    handlePlayerRangeToggle,
    handlePlaytimeRangeToggle,
    handleAgeRatingToggle,
    handleSaleToggle,
  };
};
