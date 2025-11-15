import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useProductPricing } from "../hooks/useProductPricing";
import { useChunkedProductCatalog } from "../hooks/useChunkedProductCatalog";
import { useFilteredCatalogIndex } from "../hooks/useFilteredCatalogIndex";
import { useTranslation } from "../hooks/useTranslation";
import { searchSnapshotsByName } from "../services/productService";
import type { ProductSeries } from "../types/product";
import type { AvailabilityFilter } from "../types/filters";
import { FiltersPanel } from "./search/FiltersPanel";
import {
  FilteredProductsSection,
  FILTERED_PAGE_SIZE,
} from "./search/FilteredProductsSection";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";

interface SearchPageProps {
  onProductNavigate: (productCode: string) => void;
}

const MAX_SEARCH_SERIES = Number(
  import.meta.env.VITE_SEARCH_MAX_SERIES ?? "6"
);

const parsePriceInput = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const SearchPage = ({ onProductNavigate }: SearchPageProps) => {
  const { t, locale } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [selectedSeries, setSelectedSeries] = useState<ProductSeries | null>(
    null
  );
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [pricePage, setPricePage] = useState(1);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();

  const searchLoader = useCallback(() => {
    if (debouncedQuery.length < 2) {
      return Promise.resolve([]);
    }
    return searchSnapshotsByName(debouncedQuery, undefined, availabilityFilter);
  }, [availabilityFilter, debouncedQuery]);

  const {
    series: searchSeries,
    loading: searchLoading,
    error: searchError,
    reload: reloadSearch,
  } = useProductPricing(searchLoader);

  const priceRange = useMemo(
    () => ({
      min: parsePriceInput(priceFilter.min),
      max: parsePriceInput(priceFilter.max),
    }),
    [priceFilter]
  );

  const { series: allSeries } = useChunkedProductCatalog();

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

  const priceBounds = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    allSeries.forEach((series) => {
      series.points.forEach((point) => {
        if (point.price < min) {
          min = point.price;
        }
        if (point.price > max) {
          max = point.price;
        }
      });
      if (series.points.length === 0) {
        [series.firstPrice, series.latestPrice].forEach((price) => {
          if (price === null || Number.isNaN(price)) {
            return;
          }
          if (price < min) {
            min = price;
          }
          if (price > max) {
            max = price;
          }
        });
      }
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: 0, max: 1000 };
    }
    if (min === max) {
      return { min: Math.floor(min), max: Math.ceil(min + 100) };
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [allSeries]);

  const handlePriceFilterChange = useCallback(
    (key: "min" | "max", value: string) => {
      setPriceFilter((current) => ({ ...current, [key]: value }));
      setPricePage(1);
    },
    []
  );

  const handleSliderChange = useCallback(
    (key: "min" | "max", numericValue: number) => {
      const rounded = Math.max(0, Math.round(numericValue));
      setPriceFilter((current) => ({
        ...current,
        [key]: rounded.toString(),
      }));
      setPricePage(1);
    },
    []
  );

  useEffect(() => {
    setPricePage(1);
  }, [availabilityFilter, categoryFilters]);

  const matchesCategoryFilters = useCallback(
    (series: ProductSeries) => {
      if (categoryFilters.length === 0) {
        return true;
      }
      return categoryFilters.some((category) =>
        series.categoryTags.includes(category)
      );
    },
    [categoryFilters]
  );

  const filteredSearchSeries = useMemo(
    () => searchSeries.filter(matchesCategoryFilters),
    [matchesCategoryFilters, searchSeries]
  );

  const visibleSeries = useMemo(
    () => filteredSearchSeries.slice(0, MAX_SEARCH_SERIES),
    [filteredSearchSeries]
  );

  const overlayVisible = searchActive && debouncedQuery.length >= 2;

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>();
    const collect = (seriesList: ProductSeries[]) => {
      seriesList.forEach((series) => {
        series.categoryTags.forEach((category) => unique.add(category));
      });
    };
    collect(allSeries);
    collect(searchSeries);
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "cs"));
  }, [allSeries, searchSeries]);

  const filteredCategoryOptions = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) {
      return categoryOptions;
    }
    return categoryOptions.filter((category) =>
      category.toLowerCase().includes(query)
    );
  }, [categoryOptions, categorySearch]);

  useEffect(() => {
    setCategoryFilters((current) => {
      const filtered = current.filter((category) =>
        categoryOptions.includes(category)
      );
      return filtered.length === current.length ? current : filtered;
    });
  }, [categoryOptions]);

  const handleCategoryToggle = useCallback((category: string) => {
    setCategoryFilters((current) => {
      if (current.includes(category)) {
        return current.filter((entry) => entry !== category);
      }
      return [...current, category];
    });
    setPricePage(1);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white">
      <AppHeader
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          if (!value.trim()) {
            setSearchActive(false);
          }
        }}
        onSearchFocus={() => setSearchActive(true)}
        t={t}
      />
      <ProductSearchOverlay
        visible={overlayVisible}
        loading={searchLoading}
        error={searchError}
        results={visibleSeries}
        query={debouncedQuery}
        locale={locale}
        t={t}
        onRetry={reloadSearch}
        onSelect={(series) => {
          setSearchActive(false);
          onProductNavigate(series.productCode);
        }}
        onClose={() => setSearchActive(false)}
      />
      <main className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:self-start">
              <FiltersPanel
                className="lg:flex lg:h-full lg:flex-col lg:overflow-y-auto"
                availabilityFilter={availabilityFilter}
                onAvailabilityChange={setAvailabilityFilter}
                priceFilter={priceFilter}
                priceRangeValues={priceRange}
                priceBounds={priceBounds}
                onPriceFilterChange={handlePriceFilterChange}
                onSliderChange={handleSliderChange}
                categoryOptions={filteredCategoryOptions}
                selectedCategories={categoryFilters}
                onCategoryToggle={handleCategoryToggle}
                hasCategoryOptions={categoryOptions.length > 0}
                categorySearchValue={categorySearch}
                onCategorySearchChange={setCategorySearch}
                t={t}
              />
            </div>
            <div className="flex flex-col gap-8">
              <FilteredProductsSection
                series={filteredSeries}
                total={filteredTotal}
                loading={filteredLoading}
                error={filteredError}
                reload={reloadFiltered}
                locale={locale}
                t={t}
                priceRange={priceRange}
                page={pricePage}
                onPageChange={setPricePage}
                onNavigateToSeries={(series) =>
                  onProductNavigate(series.productCode)
                }
                selectedSeries={selectedSeries}
                onSelectSeries={setSelectedSeries}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
