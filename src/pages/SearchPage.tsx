import { useMemo } from "react";
import { Seo } from "../components/Seo";
import { useTranslation } from "../hooks/useTranslation";
import { FiltersPanel } from "./search/FiltersPanel";
import { MobileFiltersDrawer } from "./search/MobileFiltersDrawer";
import { FilteredProductsSection } from "./search/FilteredProductsSection";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { HOME_SEO_COPY, buildHomeStructuredData } from "../utils/seoContent";
import { AppFooter } from "../components/ui/AppFooter";
import { CtaBanner } from "../components/ui/CtaBanner";
import { CatalogToolbar } from "./search/CatalogToolbar";
import { SearchHero } from "./search/SearchHero";
import { useSearchPageState } from "./search/useSearchPageState";

interface SearchPageProps {
  onProductNavigate: (productSlug: string) => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const MAX_SEARCH_SERIES = Number(import.meta.env.VITE_SEARCH_MAX_SERIES ?? "6");
const OVERLAY_SEARCH_LIMIT = MAX_SEARCH_SERIES * 6;

const SearchPage = ({
  onProductNavigate,
  onNavigatePath,
  activePath,
}: SearchPageProps) => {
  const { t, locale } = useTranslation();
  const homeSeo = useMemo(() => HOME_SEO_COPY[locale], [locale]);
  const homeStructuredData = useMemo(
    () => buildHomeStructuredData(locale),
    [locale]
  );
  const state = useSearchPageState(MAX_SEARCH_SERIES, OVERLAY_SEARCH_LIMIT);

  return (
    <div className="min-h-screen bg-background text-navy">
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
      <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <SearchHero total={state.filteredTotal} />
          <CatalogToolbar
            searchValue={state.searchValue}
            onSearchValueChange={state.handleSearchChange}
            onSearchActiveChange={state.setSearchActive}
            onOpenFilters={() => state.setFiltersOpen(true)}
            categoryFilters={state.categoryFilters}
            availabilityFilter={state.availabilityFilter}
            onCategoryToggle={state.handleCategoryToggle}
          />

          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
              <FiltersPanel
                className="lg:flex lg:flex-col lg:overflow-y-auto"
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
              onNavigateToSeries={(series) => onProductNavigate(series.slug)}
            />
          </div>

          <CtaBanner
            title="Najděte svou další oblíbenou deskovku"
            subtitle="Porovnejte ceny, sledujte historii a nakupte ve správný čas."
            actionLabel="Procházet akce"
          />
        </div>
      </main>
      <AppFooter />
    </div>
  );
};

export default SearchPage;
