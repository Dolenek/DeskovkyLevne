import { useMemo } from "react";
import { AppHeader } from "../../components/AppHeader";
import { ProductChart } from "../../components/ProductChart";
import { ProductSearchOverlay } from "../../components/ProductSearchOverlay";
import { ProductTile } from "../../components/ProductTile";
import { SellerOfferTable } from "../../components/SellerOfferTable";
import { Seo } from "../../components/Seo";
import { AppFooter } from "../../components/ui/AppFooter";
import { CtaBanner } from "../../components/ui/CtaBanner";
import { Icon } from "../../components/ui/Icon";
import { useFilteredCatalogIndex } from "../../hooks/useFilteredCatalogIndex";
import { useSearchOverlayState } from "../../hooks/useSearchOverlayState";
import { useTranslation } from "../../hooks/useTranslation";
import type { ProductSeries } from "../../types/product";
import { formatPrice } from "../../utils/numberFormat";
import { getPriceStats } from "../../utils/priceStats";
import { buildAbsoluteUrl } from "../../utils/urls";
import { LANDING_SEO_COPY } from "../../utils/seoContent";

interface LandingPageProps {
  variant: "levne" | "deskove";
  onNavigateToProduct: (slug: string) => void;
  onNavigateHome: () => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const OVERLAY_LIMIT = 6;
const FEATURED_PAGE_SIZE = 12;

const buildLandingCopy = (variant: "levne" | "deskove") =>
  variant === "levne"
    ? {
        heading: "Sledujte historii cen deskových her a nakupujte levněji",
        subheading:
          "Porovnáváme ceny z různých e-shopů, ukazujeme vývoj ceny v čase a pomáháme najít nejlepší nabídku.",
        featuredTitle: "Populární deskové hry",
        cta: "Najděte nejlepší cenu své příští deskovky",
      }
    : {
        heading: "Katalog deskových her s přehledem cen",
        subheading:
          "Procházejte hry podle slugu, dostupnosti a historie cen napříč českými e-shopy.",
        featuredTitle: "Vybrané deskové hry",
        cta: "Najděte svou další oblíbenou deskovku",
      };

const StatPill = ({
  icon,
  value,
  label,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  value: string;
  label: string;
}) => (
  <div className="flex items-center gap-3">
    <Icon name={icon} className="h-6 w-6 text-primary" />
    <div>
      <p className="text-lg font-extrabold text-navy">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  </div>
);

const HowItWorks = () => {
  const items = [
    {
      icon: "store" as const,
      title: "1. Sbíráme ceny",
      body: "Každý den procházíme desítky e-shopů a sbíráme aktuální ceny.",
    },
    {
      icon: "barChart" as const,
      title: "2. Sledujeme vývoj",
      body: "U každé hry ukládáme historii cen, aby bylo vidět, kdy zlevňuje.",
    },
    {
      icon: "tag" as const,
      title: "3. Porovnáváme nabídky",
      body: "Ukážeme dostupné prodejce a nejvýhodnější cenu právě teď.",
    },
  ];

  return (
    <section>
      <h2 className="text-center text-2xl font-extrabold text-navy">Jak to funguje</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-primary">
                <Icon name={item.icon} className="h-7 w-7" />
              </span>
              <h3 className="font-extrabold text-navy">{item.title}</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

const HeroPreview = ({
  series,
  locale,
}: {
  series: ProductSeries | null;
  locale: "cs" | "en";
}) => {
  if (!series) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 shadow-xl">
        <div className="aspect-[4/3] rounded-lg bg-slate-100" />
      </div>
    );
  }

  const stats = getPriceStats(series);

  return (
    <div className="relative rounded-lg border border-line bg-white p-5 shadow-2xl shadow-slate-200">
      <div className="flex items-start gap-4">
        {series.heroImage ? (
          <img src={series.heroImage} alt={series.label} className="h-28 w-28 rounded-lg object-cover" />
        ) : null}
        <div>
          <h3 className="text-lg font-extrabold text-navy">{series.label}</h3>
          <p className="mt-1 text-sm text-muted">{series.categoryTags[0] ?? "Desková hra"}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-muted">
            <span>{series.sellers.length} e-shopů</span>
            <span>{series.sellers.reduce((sum, seller) => sum + seller.points.length, 0)} cen</span>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <ProductChart series={series} locale={locale} priceLabel="Cena" dateLabel="Datum" />
      </div>
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-right">
        <p className="text-sm font-bold text-primary">Nejnižší zaznamenaná cena</p>
        <p className="text-2xl font-extrabold text-primary">
          {formatPrice(stats.minimum, series.currency ?? undefined, locale)}
        </p>
      </div>
    </div>
  );
};

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
  const {
    searchValue,
    setSearchValue,
    setSearchActive,
    overlayVisible,
    overlayResults,
    loading: searchLoading,
    error: searchError,
    reload: reloadSearch,
    debouncedQuery,
  } = useSearchOverlayState(OVERLAY_LIMIT);

  const { series: featuredSeries, total } = useFilteredCatalogIndex({
    availabilityFilter: variant === "levne" ? "available" : "all",
    priceRange: { min: null, max: null },
    categoryFilters: [],
    page: 1,
    pageSize: FEATURED_PAGE_SIZE,
  });

  const showcase = useMemo(
    () => featuredSeries.find((series) => series.points.length > 1) ?? featuredSeries[0] ?? null,
    [featuredSeries]
  );

  const structuredData = useMemo(() => {
    const items = featuredSeries.map((series, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: series.label,
      url:
        buildAbsoluteUrl(`/deskove-hry/${encodeURIComponent(series.slug)}`) ??
        `/deskove-hry/${series.slug}`,
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
      <Seo
        title={seoCopy.title}
        description={seoCopy.description}
        path={landingPath}
        locale={locale}
        keywords={seoCopy.keywords}
        structuredData={structuredData}
      />
      <AppHeader
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          setSearchActive(Boolean(value.trim()));
        }}
        onSearchFocus={() => setSearchActive(true)}
        onLogoClick={onNavigateHome}
        onNavigatePath={onNavigatePath}
        activePath={activePath}
        t={t}
      />
      <ProductSearchOverlay
        visible={overlayVisible}
        loading={searchLoading}
        error={searchError}
        results={overlayResults}
        query={debouncedQuery}
        locale={locale}
        t={t}
        onRetry={reloadSearch}
        onSelect={(series) => {
          setSearchActive(false);
          onNavigateToProduct(series.slug);
        }}
        onClose={() => setSearchActive(false)}
      />
      <main className="px-4 pb-12 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-12">
          <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-navy sm:text-5xl">
                {copy.heading}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
                {copy.subheading}
              </p>
              <div className="mt-8 flex max-w-2xl rounded-lg border border-line bg-white p-2 shadow-lg">
                <Icon name="search" className="ml-3 mt-3 h-5 w-5 text-muted" />
                <input
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setSearchActive(true);
                  }}
                  onFocus={() => setSearchActive(true)}
                  placeholder="Zadejte název deskové hry..."
                  className="min-w-0 flex-1 px-3 py-3 text-sm font-semibold outline-none placeholder:text-muted"
                />
                <button className="rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-white">
                  Vyhledat
                </button>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                <StatPill icon="spark" value={total ? total.toLocaleString("cs-CZ") : "--"} label="sledovaných her" />
                <StatPill icon="store" value="více" label="e-shopů v katalogu" />
                <StatPill icon="refresh" value="denně" label="aktualizované ceny" />
              </div>
            </div>
            <HeroPreview series={showcase} locale={locale} />
          </section>

          <HowItWorks />

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-navy">{copy.featuredTitle}</h2>
              <button
                type="button"
                onClick={() => onNavigatePath("/deskove-hry")}
                className="text-sm font-extrabold text-primary hover:text-emerald-700"
              >
                Zobrazit všechny hry →
              </button>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredSeries.slice(0, 4).map((series) => (
                <ProductTile
                  key={series.slug}
                  series={series}
                  locale={locale}
                  onNavigate={onNavigateToProduct}
                />
              ))}
            </div>
          </section>

          {showcase ? (
            <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-2xl font-extrabold text-navy">Ukázka historie ceny</h2>
                <div className="mt-5 rounded-lg border border-line bg-white p-5 shadow-sm">
                  <h3 className="font-extrabold text-navy">{showcase.label}</h3>
                  <p className="mt-1 text-sm text-muted">{showcase.categoryTags[0] ?? "Desková hra"}</p>
                  <p className="mt-6 text-sm font-bold text-muted">Nejnižší cena v historii:</p>
                  <p className="text-4xl font-black text-primary">
                    {formatPrice(getPriceStats(showcase).minimum, showcase.currency ?? undefined, locale)}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <ProductChart series={showcase} locale={locale} priceLabel={t("price")} dateLabel={t("date")} />
              </div>
            </section>
          ) : null}

          {showcase ? (
            <section>
              <h2 className="mb-5 text-2xl font-extrabold text-navy">Kde koupit nejlevněji</h2>
              <SellerOfferTable series={showcase} locale={locale} />
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-4">
            {[
              ["barChart", "Přehledná historie cen", "U každé hry vidíte vývoj ceny v čase."],
              ["search", "Rychlé porovnání", "Během pár vteřin zjistíte nabídky e-shopů."],
              ["bell", "Upozornění na pokles", "Vizuální příprava pro budoucí hlídání ceny."],
              ["shield", "Úspora času", "Sledujte ceny na jednom místě."],
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
          />
        </div>
      </main>
      <AppFooter />
    </div>
  );
};
