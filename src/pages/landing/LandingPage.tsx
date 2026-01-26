import { useMemo } from "react";
import { AppHeader } from "../../components/AppHeader";
import { ProductSearchOverlay } from "../../components/ProductSearchOverlay";
import { Seo } from "../../components/Seo";
import { useFilteredCatalogIndex } from "../../hooks/useFilteredCatalogIndex";
import { useRecentDiscounts } from "../../hooks/useRecentDiscounts";
import { useSearchOverlayState } from "../../hooks/useSearchOverlayState";
import { useTranslation } from "../../hooks/useTranslation";
import type { ProductSeries } from "../../types/product";
import { formatPrice } from "../../utils/numberFormat";
import { buildAbsoluteUrl } from "../../utils/urls";
import { LANDING_SEO_COPY } from "../../utils/seoContent";

interface LandingPageProps {
  variant: "levne" | "deskove";
  onNavigateToProduct: (slug: string) => void;
  onNavigateHome: () => void;
}

const OVERLAY_LIMIT = 6;
const FEATURED_PAGE_SIZE = 12;

const buildLandingCopy = (variant: "levne" | "deskove", locale: "cs" | "en") => {
  if (variant === "levne") {
    return locale === "en"
      ? {
          heading: "Affordable board games",
          subheading:
            "Track current prices and availability from Czech retailers. Compare by slug and follow discounts over time.",
          featuredTitle: "Popular affordable picks",
          discountTitle: "Recent price drops",
        }
      : {
          heading: "Levné deskovky",
          subheading:
            "Sledujte aktuální ceny a dostupnost u českých prodejců. Porovnávejte podle slugu a sledujte slevy v čase.",
          featuredTitle: "Oblíbené levné tituly",
          discountTitle: "Nedávné slevy",
        };
  }
  return locale === "en"
    ? {
        heading: "Board games",
        subheading:
          "Browse Czech board games by slug, availability, and price history across retailers.",
        featuredTitle: "Featured board games",
        discountTitle: "Recent price drops",
      }
    : {
        heading: "Deskové hry",
        subheading:
          "Procházejte deskové hry podle slugu, dostupnosti a historie cen napříč českými obchody.",
        featuredTitle: "Vybrané deskové hry",
        discountTitle: "Nedávné slevy",
      };
};

const LandingHero = ({
  heading,
  subheading,
}: {
  heading: string;
  subheading: string;
}) => (
  <section className="rounded-3xl border border-slate-800 bg-surface/70 p-8 shadow-2xl shadow-black/40 backdrop-blur">
    <h1 className="text-3xl font-semibold text-white sm:text-4xl">
      {heading}
    </h1>
    <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
      {subheading}
    </p>
  </section>
);

const ProductCard = ({
  series,
  onNavigate,
  locale,
}: {
  series: ProductSeries;
  onNavigate: (slug: string) => void;
  locale: "cs" | "en";
}) => {
  const href = `/deskove-hry/${encodeURIComponent(series.slug)}`;
  const price = formatPrice(series.latestPrice, series.currency ?? undefined, locale);
  return (
    <a
      href={href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          event.shiftKey
        ) {
          return;
        }
        event.preventDefault();
        onNavigate(series.slug);
      }}
      className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-black/20 p-5 transition hover:border-primary/60"
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-900/70">
          {series.heroImage ? (
            <img
              src={series.heroImage}
              alt={series.label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
              {series.label.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-white">{series.label}</span>
          <span className="text-xs text-slate-400">{series.slug}</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between text-sm text-slate-300">
        <span>{series.availabilityLabel ?? "—"}</span>
        <span className="text-lg font-semibold text-white">{price}</span>
      </div>
    </a>
  );
};

const DiscountCard = ({
  discount,
  onNavigate,
  locale,
}: {
  discount: {
    productSlug: string;
    productName: string;
    currentPrice: number;
    previousPrice: number;
    currency?: string | null;
  };
  onNavigate: (slug: string) => void;
  locale: "cs" | "en";
}) => {
  const href = `/deskove-hry/${encodeURIComponent(discount.productSlug)}`;
  const current = formatPrice(discount.currentPrice, discount.currency ?? undefined, locale);
  const previous = formatPrice(discount.previousPrice, discount.currency ?? undefined, locale);
  const delta = formatPrice(
    discount.currentPrice - discount.previousPrice,
    discount.currency ?? undefined,
    locale
  );
  return (
    <a
      href={href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          event.shiftKey
        ) {
          return;
        }
        event.preventDefault();
        onNavigate(discount.productSlug);
      }}
      className="flex flex-col gap-2 rounded-3xl border border-slate-800 bg-black/20 p-5 transition hover:border-primary/60"
    >
      <span className="text-sm uppercase tracking-wide text-slate-400">
        {discount.productSlug}
      </span>
      <span className="text-lg font-semibold text-white">
        {discount.productName}
      </span>
      <div className="text-sm text-slate-300">
        <span className="line-through text-slate-500">{previous}</span>
        <span className="ml-2 text-emerald-300">{current}</span>
        <span className="ml-2 text-emerald-400">({delta})</span>
      </div>
    </a>
  );
};

export const LandingPage = ({
  variant,
  onNavigateToProduct,
  onNavigateHome,
}: LandingPageProps) => {
  const { t, locale } = useTranslation();
  const seoCopy = LANDING_SEO_COPY[locale][variant];
  const heroCopy = buildLandingCopy(variant, locale);
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

  const { series: featuredSeries } = useFilteredCatalogIndex({
    availabilityFilter: variant === "levne" ? "available" : "all",
    priceRange: { min: null, max: null },
    categoryFilters: [],
    page: 1,
    pageSize: FEATURED_PAGE_SIZE,
  });

  const { items: recentDiscounts } = useRecentDiscounts();
  const discountList = useMemo(() => recentDiscounts.slice(0, 6), [recentDiscounts]);

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
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: items,
      },
    ];
  }, [featuredSeries, landingPath, locale, seoCopy.description, seoCopy.title]);

  return (
    <div className="min-h-screen bg-background text-white">
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
        onLogoClick={() => {
          setSearchActive(false);
          onNavigateHome();
        }}
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
      <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <LandingHero heading={heroCopy.heading} subheading={heroCopy.subheading} />
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-semibold text-white">
                {heroCopy.featuredTitle}
              </h2>
              <span className="text-sm text-slate-400">
                {variant === "levne"
                  ? locale === "en"
                    ? "In stock"
                    : "Skladem"
                  : locale === "en"
                    ? "All availability"
                    : "Všechny dostupnosti"}
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredSeries.map((series) => (
                <ProductCard
                  key={series.slug}
                  series={series}
                  onNavigate={onNavigateToProduct}
                  locale={locale}
                />
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">
              {heroCopy.discountTitle}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discountList.map((discount) => (
                <DiscountCard
                  key={discount.productSlug}
                  discount={discount}
                  onNavigate={onNavigateToProduct}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
