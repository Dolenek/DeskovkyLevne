import { useMemo } from "react";
import { AppHeader } from "../../components/AppHeader";
import { ProductSearchOverlay } from "../../components/ProductSearchOverlay";
import { Seo } from "../../components/Seo";
import { AppFooter } from "../../components/ui/AppFooter";
import { CtaBanner } from "../../components/ui/CtaBanner";
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
import { buildLandingCopy, collectVisualImages } from "./landingUtils";

interface LandingPageProps {
  variant: "levne" | "deskove";
  onNavigateToProduct: (slug: string) => void;
  onNavigateHome: () => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const OVERLAY_LIMIT = 6;
const FEATURED_PAGE_SIZE = 12;

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
  const landingPath = variant === "levne" ? "/levne-deskovky" : "/deskove-hry";
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

  const showcase = useMemo(
    () =>
      featuredSeries.find((series) => series.heroImage && series.points.length > 1) ??
      featuredSeries.find((series) => series.heroImage) ??
      featuredSeries.find((series) => series.points.length > 1) ??
      featuredSeries[0] ??
      null,
    [featuredSeries]
  );
  const visualImages = useMemo(() => collectVisualImages(featuredSeries), [featuredSeries]);
  const structuredData = useMemo(() => {
    const items = featuredSeries.map((series, index) => ({
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
  }, [featuredSeries, landingPath, locale, seoCopy.description, seoCopy.title]);

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
            <HeroPreview series={showcase} locale={locale} visualImages={visualImages} />
          </section>

          <HowItWorks />
          <FeaturedProducts title={copy.featuredTitle} series={featuredSeries} locale={locale} onNavigate={onNavigateToProduct} onShowAll={() => onNavigatePath("/")} />
          {showcase ? <ShowcaseSections showcase={showcase} locale={locale} /> : null}

          <section className="grid gap-4 md:grid-cols-4">
            {[
              ["barChart", "Přehledná historie cen", "U každé hry vidíte vývoj ceny v čase a snadno poznáte, kdy je nejlepší nakoupit."],
              ["search", "Rychlé porovnání e-shopů", "Během pár vteřin zjistíte, který e-shop má nejlepší nabídku včetně dopravy a akcí."],
              ["bell", "Upozornění na pokles ceny", "Nastavte si hlídání ceny a my vás upozorníme, až cena vaší hry klesne."],
              ["shield", "Úspora času i peněz", "Šetřete čas hledáním a nakupujte chytře za nejlepší možné ceny."],
            ].map(([icon, title, body]) => (
              <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <Icon name={icon as Parameters<typeof Icon>[0]["name"]} className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-extrabold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </section>

          <CtaBanner
            title={copy.cta}
            subtitle="Tisíce her, desítky e-shopů, jedna chytrá volba."
            actionLabel="Procházet hry"
            imageUrls={visualImages}
          />
        </div>
      </main>
      <AppFooter />
    </div>
  );
};
