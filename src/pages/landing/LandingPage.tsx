import { useCallback, useMemo, useRef } from "react";
import { AppHeader } from "../../components/AppHeader";
import { ProductSearchOverlay } from "../../components/ProductSearchOverlay";
import { Seo } from "../../components/Seo";
import { AppFooter } from "../../components/ui/AppFooter";
import { Icon } from "../../components/ui/Icon";
import { useCatalogOverview } from "../../hooks/useCatalogOverview";
import { useFilteredCatalogIndex } from "../../hooks/useFilteredCatalogIndex";
import { useSearchHotkey } from "../../hooks/useSearchHotkey";
import { useSearchOverlayState } from "../../hooks/useSearchOverlayState";
import { useTranslation } from "../../hooks/useTranslation";
import { buildAbsoluteUrl } from "../../utils/urls";
import { LANDING_SEO_COPY } from "../../utils/seoContent";
import {
  FeaturedProducts,
  HeroPreview,
  HowItWorks,
  StatPill,
} from "./LandingSections";
import { buildLandingCopy, toAppLocaleTag } from "./landingUtils";

interface LandingPageProps {
  variant: "levne" | "deskove";
  onNavigateToProduct: (slug: string) => void;
  onNavigateHome: () => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const OVERLAY_LIMIT = 60;
const FEATURED_PAGE_SIZE = 12;
const LANDING_RANDOM_PAGE_SIZE = 12;

const createLandingRandomSeed = () => Math.floor(Math.random() * 2_147_483_647);

export const LandingPage = ({
  variant,
  onNavigateToProduct,
  onNavigateHome,
  onNavigatePath,
  activePath,
}: LandingPageProps) => {
  const { t, locale } = useTranslation();
  const seoCopy = LANDING_SEO_COPY[locale][variant];
  const copy = buildLandingCopy(variant, t);
  const localeTag = toAppLocaleTag(locale);
  const landingPath = variant === "levne" ? "/" : "/deskove-hry";
  const searchState = useSearchOverlayState(OVERLAY_LIMIT);
  const { setSearchActive } = searchState;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activateHeaderSearch = useCallback(() => {
    setSearchActive(true);
  }, [setSearchActive]);

  useSearchHotkey({
    inputRef: searchInputRef,
    onActivate: activateHeaderSearch,
  });
  const landingRandomSeed = useMemo(createLandingRandomSeed, []);
  const catalogOverview = useCatalogOverview();
  const {
    series: randomCatalogSeries,
    loading: landingCatalogLoading,
  } = useFilteredCatalogIndex({
    availabilityFilter: "available",
    priceRange: { min: null, max: null },
    categoryFilters: [],
    playerRangeFilters: [],
    playtimeRangeFilters: [],
    ageRatingFilters: [],
    priceMovementFilter: null,
    randomSeed: landingRandomSeed,
    page: 1,
    pageSize: LANDING_RANDOM_PAGE_SIZE,
  });
  const heroProduct = useMemo(() => {
    return randomCatalogSeries[0] ?? null;
  }, [randomCatalogSeries]);
  const randomFeaturedSeries = useMemo(() => {
    const entriesWithoutHero = randomCatalogSeries.filter(
      (series) => series.slug !== heroProduct?.slug
    );
    return (entriesWithoutHero.length ? entriesWithoutHero : randomCatalogSeries).slice(
      0,
      FEATURED_PAGE_SIZE
    );
  }, [heroProduct?.slug, randomCatalogSeries]);
  const structuredData = useMemo(() => {
    const items = randomFeaturedSeries.map((series, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: series.label,
      url: buildAbsoluteUrl(`/deskove-hry/${encodeURIComponent(series.slug)}`) ?? `/deskove-hry/${series.slug}`,
    }));
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: seoCopy.title,
        description: seoCopy.description,
        url: buildAbsoluteUrl(landingPath) ?? landingPath,
        inLanguage: locale === "en" ? "en" : "cs",
      },
      { "@context": "https://schema.org", "@type": "ItemList", itemListElement: items },
    ];
  }, [landingPath, locale, randomFeaturedSeries, seoCopy.description, seoCopy.title]);

  return (
    <div className="min-h-screen bg-background text-navy">
      <Seo title={seoCopy.title} description={seoCopy.description} path={landingPath} locale={locale} keywords={seoCopy.keywords} structuredData={structuredData} />
      <AppHeader
        searchValue={searchState.searchValue}
        onSearchChange={(value) => {
          searchState.setSearchValue(value);
          searchState.setSearchActive(Boolean(value.trim()));
        }}
        onSearchFocus={activateHeaderSearch}
        searchInputRef={searchInputRef}
        onLogoClick={onNavigateHome}
        onNavigatePath={onNavigatePath}
        activePath={activePath}
        t={t}
      />
      <ProductSearchOverlay
        visible={searchState.overlayVisible}
        loading={searchState.loading}
        error={searchState.error}
        results={searchState.overlayResults}
        query={searchState.debouncedQuery}
        locale={locale}
        t={t}
        onRetry={searchState.reload}
        onSelect={(series) => {
          searchState.setSearchActive(false);
          onNavigateToProduct(series.slug);
        }}
        onClose={() => searchState.setSearchActive(false)}
      />
      <main className="px-4 pb-12 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-12">
          <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-navy sm:text-5xl">
                {copy.heading}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{copy.subheading}</p>
              <div className="mt-8 flex max-w-2xl rounded-lg border border-line bg-white p-2 shadow-lg">
                <Icon name="search" className="ml-3 mt-3 h-5 w-5 text-muted" />
                <input
                  value={searchState.searchValue}
                  onChange={(event) => {
                    searchState.setSearchValue(event.target.value);
                    searchState.setSearchActive(true);
                  }}
                  onFocus={() => searchState.setSearchActive(true)}
                  placeholder={t("landingSearchPlaceholder")}
                  className="min-w-0 flex-1 px-3 py-3 text-sm font-semibold outline-none placeholder:text-muted"
                />
                <button className="rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-white">
                  {t("searchButton")}
                </button>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                <StatPill
                  icon="spark"
                  value={catalogOverview?.total.toLocaleString(localeTag) ?? "—"}
                  label={catalogOverview
                    ? t("landingCatalogOverview", {
                        available: catalogOverview.available.toLocaleString(localeTag),
                      })
                    : t("landingTrackedGames")}
                />
                <StatPill icon="store" value="15" label={t("landingShopCount")} />
                <StatPill icon="refresh" value="99 %" label={t("landingDailyUpdates")} />
              </div>
            </div>
            <HeroPreview
              series={heroProduct}
              loading={landingCatalogLoading}
              locale={locale}
              t={t}
              onNavigate={onNavigateToProduct}
            />
          </section>

          <HowItWorks t={t} />
          <FeaturedProducts
            title={copy.featuredTitle}
            series={randomFeaturedSeries}
            loading={landingCatalogLoading}
            locale={locale}
            t={t}
            onNavigate={onNavigateToProduct}
            onShowAll={() => onNavigatePath("/deskove-hry")}
          />

        </div>
      </main>
      <AppFooter />
    </div>
  );
};
