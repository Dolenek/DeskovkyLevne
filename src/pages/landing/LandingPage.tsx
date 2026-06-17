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
  const copy = buildLandingCopy(variant);
  const landingPath = variant === "levne" ? "/" : "/deskove-hry";
  const searchState = useSearchOverlayState(OVERLAY_LIMIT);
  const landingRandomSeed = useMemo(createLandingRandomSeed, []);
  const { series: randomCatalogSeries, total } = useFilteredCatalogIndex({
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

        </div>
      </main>
      <AppFooter />
    </div>
  );
};
