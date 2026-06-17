import { useMemo } from "react";
import { AppHeader } from "../../components/AppHeader";
import { ProductSearchOverlay } from "../../components/ProductSearchOverlay";
import { Seo } from "../../components/Seo";
import { AppFooter } from "../../components/ui/AppFooter";
import { Icon } from "../../components/ui/Icon";
import { useFilteredCatalogIndex } from "../../hooks/useFilteredCatalogIndex";
import { useSearchOverlayState } from "../../hooks/useSearchOverlayState";
import { useTranslation } from "../../hooks/useTranslation";
import { buildAbsoluteUrl } from "../../utils/urls";
import { LANDING_SEO_COPY } from "../../utils/seoContent";
import {
  FeaturedProducts,
  HeroPreview,
  HowItWorks,
  ShowcaseSections,
  StatPill,
} from "./LandingSections";
import { buildLandingCopy } from "./landingUtils";

interface LandingPageProps {
  variant: "levne" | "deskove";
  onNavigateToProduct: (slug: string) => void;
  onNavigateHome: () => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const OVERLAY_LIMIT = 6;
const FEATURED_PAGE_SIZE = 12;
const HERO_CANDIDATE_PAGE_SIZE = 32;

const getSeededSortValue = (seed: number, index: number) => {
  const value = Math.sin(seed * 10000 + index * 9973) * 10000;
  return value - Math.floor(value);
};

const getRandomizedSeries = <T,>(entries: T[], seed: number) =>
  entries
    .map((entry, index) => ({ entry, sortValue: getSeededSortValue(seed, index) }))
    .sort((left, right) => left.sortValue - right.sortValue)
    .map(({ entry }) => entry);

export const LandingPage = ({
  variant,
  onNavigateToProduct,
  onNavigateHome,
  onNavigatePath,
  activePath,
}: LandingPageProps) => {
  const { t, locale } = useTranslation();
  const seoCopy = LANDING_SEO_COPY[locale][variant];
  const copy = buildLandingCopy(variant);
  const landingPath = variant === "levne" ? "/" : "/deskove-hry";
  const searchState = useSearchOverlayState(OVERLAY_LIMIT);
  const { series: featuredSeries, total } = useFilteredCatalogIndex({
    availabilityFilter: variant === "levne" ? "available" : "all",
    priceRange: { min: null, max: null },
    categoryFilters: [],
    playerRangeFilters: [],
    playtimeRangeFilters: [],
    ageRatingFilters: [],
    priceMovementFilter: variant === "levne" ? "decreased" : null,
    page: 1,
    pageSize: FEATURED_PAGE_SIZE,
  });
  const { series: availableHeroCandidates } = useFilteredCatalogIndex({
    availabilityFilter: "available",
    priceRange: { min: null, max: null },
    categoryFilters: [],
    playerRangeFilters: [],
    playtimeRangeFilters: [],
    ageRatingFilters: [],
    priceMovementFilter: null,
    page: 1,
    pageSize: HERO_CANDIDATE_PAGE_SIZE,
  });
  const landingRandomSeed = useMemo(() => Math.random(), []);
  const randomizedAvailableSeries = useMemo(
    () => getRandomizedSeries(availableHeroCandidates, landingRandomSeed),
    [availableHeroCandidates, landingRandomSeed]
  );
  const heroProduct = useMemo(() => {
    return randomizedAvailableSeries[0] ?? null;
  }, [randomizedAvailableSeries]);
  const randomFeaturedSeries = useMemo(() => {
    if (!randomizedAvailableSeries.length) {
      return featuredSeries;
    }
    const entriesWithoutHero = randomizedAvailableSeries.filter(
      (series) => series.slug !== heroProduct?.slug
    );
    return (entriesWithoutHero.length ? entriesWithoutHero : randomizedAvailableSeries).slice(
      0,
      FEATURED_PAGE_SIZE
    );
  }, [featuredSeries, heroProduct?.slug, randomizedAvailableSeries]);

  const showcase = useMemo(
    () =>
      featuredSeries.find((series) => series.heroImage && series.points.length > 1) ??
      featuredSeries.find((series) => series.heroImage) ??
      featuredSeries.find((series) => series.points.length > 1) ??
      featuredSeries[0] ??
      null,
    [featuredSeries]
  );
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
        onSearchFocus={() => searchState.setSearchActive(true)}
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
                  placeholder="Zadejte název deskové hry..."
                  className="min-w-0 flex-1 px-3 py-3 text-sm font-semibold outline-none placeholder:text-muted"
                />
                <button className="rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-white">
                  Vyhledat
                </button>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                <StatPill icon="spark" value={total ? total.toLocaleString("cs-CZ") : "5 842"} label="sledovaných her" />
                <StatPill icon="store" value="27" label="e-shopů" />
                <StatPill icon="refresh" value="98 %" label="aktualizace cen každý den" />
              </div>
            </div>
            <HeroPreview series={heroProduct} locale={locale} onNavigate={onNavigateToProduct} />
          </section>

          <HowItWorks />
          <FeaturedProducts title={copy.featuredTitle} series={randomFeaturedSeries} locale={locale} onNavigate={onNavigateToProduct} onShowAll={() => onNavigatePath("/deskove-hry")} />
          {showcase ? <ShowcaseSections showcase={showcase} locale={locale} /> : null}

        </div>
      </main>
      <AppFooter />
    </div>
  );
};
