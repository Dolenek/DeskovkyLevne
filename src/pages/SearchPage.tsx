import { useCallback, useMemo, useRef } from "react";
import { Seo } from "../components/Seo";
import { useTranslation } from "../hooks/useTranslation";
import { FiltersPanel } from "./search/FiltersPanel";
import { MobileFiltersDrawer } from "./search/MobileFiltersDrawer";
import { FilteredProductsSection } from "./search/FilteredProductsSection";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { HOME_SEO_COPY, buildHomeStructuredData } from "../utils/seoContent";
import { AppFooter } from "../components/ui/AppFooter";
import { useSearchHotkey } from "../hooks/useSearchHotkey";
import { CatalogToolbar } from "./search/CatalogToolbar";
import { useSearchPageState } from "./search/useSearchPageState";

interface SearchPageProps {
  onProductNavigate: (productSlug: string) => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const SEARCH_CANDIDATE_LIMIT = Number(import.meta.env.VITE_SEARCH_MAX_SERIES ?? "60");
const OVERLAY_SEARCH_LIMIT = SEARCH_CANDIDATE_LIMIT;

const SearchPage = ({ onProductNavigate, onNavigatePath, activePath }: SearchPageProps) => {
  const { t, locale } = useTranslation();
  const homeSeo = useMemo(() => HOME_SEO_COPY[locale], [locale]);
  const homeStructuredData = useMemo(() => buildHomeStructuredData(locale), [locale]);
  const state = useSearchPageState(SEARCH_CANDIDATE_LIMIT, OVERLAY_SEARCH_LIMIT, t);
  const { setSearchActive } = state;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activateHeaderSearch = useCallback(() => {
    setSearchActive(true);
  }, [setSearchActive]);

  useSearchHotkey({
    inputRef: searchInputRef,
    onActivate: activateHeaderSearch,
  });

  return (
    <div className="min-h-screen bg-background text-navy">
      <Seo
        title={homeSeo.title}
        description={homeSeo.description}
        path="/deskove-hry"
        locale={locale}
        keywords={homeSeo.keywords}
        structuredData={homeStructuredData}
      />
      <AppHeader
        searchValue={state.searchValue}
        onSearchChange={state.handleSearchChange}
        onSearchFocus={activateHeaderSearch}
        searchInputRef={searchInputRef}
        onLogoClick={() => onNavigatePath("/")}
        onNavigatePath={onNavigatePath}
        activePath={activePath}
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
        priceMovementFilter={state.priceMovementFilter}
        onSaleToggle={state.handleSaleToggle}
        priceFilter={state.priceFilter}
        priceRangeValues={state.priceRange}
        priceBounds={state.priceBounds}
        onPriceFilterChange={state.handlePriceFilterChange}
        onSliderChange={state.handleSliderChange}
        filterOptions={state.filterOptions}
        selectedCategories={state.categoryFilters}
        selectedPlayerRanges={state.playerRangeFilters}
        selectedPlaytimeRanges={state.playtimeRangeFilters}
        selectedAgeRatings={state.ageRatingFilters}
        onCategoryToggle={state.handleCategoryToggle}
        onPlayerRangeToggle={state.handlePlayerRangeToggle}
        onPlaytimeRangeToggle={state.handlePlaytimeRangeToggle}
        onAgeRatingToggle={state.handleAgeRatingToggle}
        t={t}
      />
      <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <CatalogToolbar
            searchValue={state.searchValue}
            onSearchValueChange={state.handleSearchChange}
            onSearchActiveChange={state.setSearchActive}
            onOpenFilters={() => state.setFiltersOpen(true)}
            categoryFilters={state.categoryFilters}
            availabilityFilter={state.availabilityFilter}
            activeFilterCount={state.activeFilterCount}
            t={t}
            onCategoryToggle={state.handleCategoryToggle}
          />
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
              <FiltersPanel
                className="lg:flex lg:flex-col"
                availabilityFilter={state.availabilityFilter}
                onAvailabilityChange={state.setAvailabilityFilter}
                priceMovementFilter={state.priceMovementFilter}
                onSaleToggle={state.handleSaleToggle}
                priceFilter={state.priceFilter}
                priceRangeValues={state.priceRange}
                priceBounds={state.priceBounds}
                onPriceFilterChange={state.handlePriceFilterChange}
                onSliderChange={state.handleSliderChange}
                filterOptions={state.filterOptions}
                selectedCategories={state.categoryFilters}
                selectedPlayerRanges={state.playerRangeFilters}
                selectedPlaytimeRanges={state.playtimeRangeFilters}
                selectedAgeRatings={state.ageRatingFilters}
                onCategoryToggle={state.handleCategoryToggle}
                onPlayerRangeToggle={state.handlePlayerRangeToggle}
                onPlaytimeRangeToggle={state.handlePlaytimeRangeToggle}
                onAgeRatingToggle={state.handleAgeRatingToggle}
                t={t}
              />
            </div>
            <FilteredProductsSection
              series={state.filteredSeries}
              total={state.filteredTotal}
              loading={state.filteredLoading}
              error={state.filteredError}
              reload={state.reloadFiltered}
              locale={locale}
              t={t}
              activeFilterChips={state.activeFilterChips}
              page={state.pricePage}
              onResetFilters={state.resetFilters}
              onPageChange={state.setPricePage}
              onNavigateToSeries={(series) => onProductNavigate(series.slug)}
            />
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
};

export default SearchPage;
