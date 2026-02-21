import { useMemo } from "react";
import { Seo } from "../components/Seo";
import { useTranslation } from "../hooks/useTranslation";
import { FiltersPanel } from "./search/FiltersPanel";
import { MobileFiltersDrawer } from "./search/MobileFiltersDrawer";
import {
  FilteredProductsSection,
} from "./search/FilteredProductsSection";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { HOME_SEO_COPY, buildHomeStructuredData } from "../utils/seoContent";
import { useSearchPageState } from "./search/useSearchPageState";

interface SearchPageProps {
  onProductNavigate: (productSlug: string) => void;
}

const MAX_SEARCH_SERIES = Number(
  import.meta.env.VITE_SEARCH_MAX_SERIES ?? "6"
);
const OVERLAY_SEARCH_LIMIT = MAX_SEARCH_SERIES * 6;

const SearchPage = ({ onProductNavigate }: SearchPageProps) => {
  const { t, locale } = useTranslation();
  const homeSeo = useMemo(() => HOME_SEO_COPY[locale], [locale]);
  const homeStructuredData = useMemo(
    () => buildHomeStructuredData(locale),
    [locale]
  );
  const state = useSearchPageState(MAX_SEARCH_SERIES, OVERLAY_SEARCH_LIMIT);

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
        searchValue={state.searchValue}
        onSearchChange={state.handleSearchChange}
        onSearchFocus={() => state.setSearchActive(true)}
        t={t}
      />
      <ProductSearchOverlay
        visible={state.overlayVisible}
        loading={state.searchLoading}
        error={state.searchError}
        results={state.visibleSeries}
        query={state.debouncedQuery}
        locale={locale}
        t={t}
        onRetry={state.reloadSearch}
        onSelect={(series) => {
          state.setSearchActive(false);
          onProductNavigate(series.slug);
        }}
        onClose={() => state.setSearchActive(false)}
      />
      <MobileFiltersDrawer
        open={state.filtersOpen}
        closeLabel={t("filtersClose")}
        onClose={() => state.setFiltersOpen(false)}
        availabilityFilter={state.availabilityFilter}
        onAvailabilityChange={state.setAvailabilityFilter}
        priceFilter={state.priceFilter}
        priceRangeValues={state.priceRange}
        priceBounds={state.priceBounds}
        onPriceFilterChange={state.handlePriceFilterChange}
        onSliderChange={state.handleSliderChange}
        categoryOptions={state.filteredCategoryOptions}
        selectedCategories={state.categoryFilters}
        onCategoryToggle={state.handleCategoryToggle}
        hasCategoryOptions={state.categoryOptions.length > 0}
        categorySearchValue={state.categorySearch}
        onCategorySearchChange={state.setCategorySearch}
        t={t}
      />
      <main className="px-4 pt-4 pb-10 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex items-center justify-start lg:hidden">
            <button
              type="button"
              onClick={() => state.setFiltersOpen(true)}
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
                availabilityFilter={state.availabilityFilter}
                onAvailabilityChange={state.setAvailabilityFilter}
                priceFilter={state.priceFilter}
                priceRangeValues={state.priceRange}
                priceBounds={state.priceBounds}
                onPriceFilterChange={state.handlePriceFilterChange}
                onSliderChange={state.handleSliderChange}
                categoryOptions={state.filteredCategoryOptions}
                selectedCategories={state.categoryFilters}
                onCategoryToggle={state.handleCategoryToggle}
                hasCategoryOptions={state.categoryOptions.length > 0}
                categorySearchValue={state.categorySearch}
                onCategorySearchChange={state.setCategorySearch}
                t={t}
              />
            </div>
            <div className="flex flex-col gap-8">
              <FilteredProductsSection
                series={state.filteredSeries}
                total={state.filteredTotal}
                loading={state.filteredLoading}
                error={state.filteredError}
                reload={state.reloadFiltered}
                locale={locale}
                t={t}
                priceRange={state.priceRange}
                page={state.pricePage}
                onPageChange={state.setPricePage}
                onNavigateToSeries={(series) =>
                  onProductNavigate(series.slug)
                }
                selectedSeries={state.selectedSeries}
                onSelectSeries={state.setSelectedSeries}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
