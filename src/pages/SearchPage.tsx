import { useCallback, useEffect, useMemo, useState } from "react";
import { Seo } from "../components/Seo";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useCatalogSearch } from "../hooks/useCatalogSearch";
import { useCategoryOptions } from "../hooks/useCategoryOptions";
import { useCatalogPriceBounds } from "../hooks/useCatalogPriceBounds";
import { useFilteredCatalogIndex } from "../hooks/useFilteredCatalogIndex";
import { useTranslation } from "../hooks/useTranslation";
import type { ProductSearchResult, ProductSeries } from "../types/product";
import type { AvailabilityFilter } from "../types/filters";
import { FiltersPanel } from "./search/FiltersPanel";
import {
  FilteredProductsSection,
  FILTERED_PAGE_SIZE,
} from "./search/FilteredProductsSection";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { uniqueSeriesBySlug } from "../utils/series";
import { HOME_SEO_COPY, buildHomeStructuredData } from "../utils/seoContent";

interface SearchPageProps {
  onProductNavigate: (productSlug: string) => void;
}

const MAX_SEARCH_SERIES = Number(
  import.meta.env.VITE_SEARCH_MAX_SERIES ?? "6"
);
const OVERLAY_SEARCH_LIMIT = MAX_SEARCH_SERIES * 6;

const parsePriceInput = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const SearchPage = ({ onProductNavigate }: SearchPageProps) => {
  const { t, locale } = useTranslation();
  const homeSeo = useMemo(() => HOME_SEO_COPY[locale], [locale]);
  const homeStructuredData = useMemo(
    () => buildHomeStructuredData(locale),
    [locale]
  );
  const [searchValue, setSearchValue] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [selectedSeries, setSelectedSeries] = useState<ProductSeries | null>(
    null
  );
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [pricePage, setPricePage] = useState(1);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    reload: reloadSearch,
  } = useCatalogSearch({
    query: debouncedQuery,
    availabilityFilter,
    limit: OVERLAY_SEARCH_LIMIT,
  });

  const priceRange = useMemo(
    () => ({
      min: parsePriceInput(priceFilter.min),
      max: parsePriceInput(priceFilter.max),
    }),
    [priceFilter]
  );

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

  const {
    categories: categoryOptions,
  } = useCategoryOptions(availabilityFilter);
  const { bounds: priceBounds } = useCatalogPriceBounds(
    availabilityFilter,
    categoryFilters
  );

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
    (series: ProductSearchResult) => {
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
    () => searchResults.filter(matchesCategoryFilters),
    [matchesCategoryFilters, searchResults]
  );

  const visibleSeries = useMemo(() => {
    const unique = uniqueSeriesBySlug(filteredSearchSeries);
    return unique.slice(0, MAX_SEARCH_SERIES);
  }, [filteredSearchSeries]);

  const overlayVisible = searchActive && debouncedQuery.length >= 2;

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
      <Seo
        title={homeSeo.title}
        description={homeSeo.description}
        path="/"
        locale={locale}
        keywords={homeSeo.keywords}
        structuredData={homeStructuredData}
      />
      <AppHeader
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          if (!value.trim()) {
            setSearchActive(false);
          } else {
            setSearchActive(true);
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
          onProductNavigate(series.slug);
        }}
        onClose={() => setSearchActive(false)}
      />
      {filtersOpen ? (
        <div className="fixed inset-0 z-[60] flex lg:hidden">
          <button
            type="button"
            aria-label={t("filtersClose")}
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="relative z-10 h-full w-full max-w-sm overflow-hidden rounded-none border-r border-slate-800 bg-slate-950/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <p className="text-lg font-semibold text-white">
                {t("filtersTitle")}
              </p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-primary hover:text-white"
              >
                {t("filtersClose")}
              </button>
            </div>
            <FiltersPanel
              showTitle={false}
              className="h-[calc(100%-4.5rem)] overflow-y-auto rounded-none border-0 bg-transparent p-5 shadow-none"
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
        </div>
      ) : null}
      <main className="px-4 pt-4 pb-10 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex items-center justify-start lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label={t("filtersOpen")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary hover:text-white"
            >
              <span className="flex h-3.5 w-3.5 flex-col justify-center gap-0.5">
                <span className="h-0.5 w-full rounded-full bg-slate-300" />
                <span className="h-0.5 w-full rounded-full bg-slate-300" />
                <span className="h-0.5 w-full rounded-full bg-slate-300" />
              </span>
              {t("filtersTitle")}
            </button>
          </div>
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden lg:block lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:self-start">
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
                  onProductNavigate(series.slug)
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
