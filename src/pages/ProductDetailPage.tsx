import { useEffect, useMemo } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncStates";
import { ProductChart } from "../components/ProductChart";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { ProductGallery } from "../components/product-detail/ProductGallery";
import { ProductHero } from "../components/product-detail/ProductHero";
import { SupplementaryParametersPanel } from "../components/product-detail/SupplementaryParametersPanel";
import { SellerOfferTable } from "../components/SellerOfferTable";
import { Seo } from "../components/Seo";
import { AppFooter } from "../components/ui/AppFooter";
import { CtaBanner } from "../components/ui/CtaBanner";
import { Icon } from "../components/ui/Icon";
import { useSearchOverlayState } from "../hooks/useSearchOverlayState";
import { useTranslation } from "../hooks/useTranslation";
import { useProductDetail } from "../hooks/useProductDetail";
import type { ProductSeries } from "../types/product";
import { buildProductDescription, buildProductStructuredData, pickPrimaryImage } from "../utils/productSeo";
import { formatPrice } from "../utils/numberFormat";
import { getPriceStats } from "../utils/priceStats";
import { buildAbsoluteUrl } from "../utils/urls";

interface ProductDetailPageProps {
  productSlug: string;
  onNavigateToProduct: (productSlug: string) => void;
  onNavigateHome: () => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const INLINE_SEARCH_LIMIT = 6;

const PriceStatsCards = ({ product, locale }: { product: ProductSeries; locale: "cs" | "en" }) => {
  const stats = getPriceStats(product);
  const cards = [
    { icon: "barChart" as const, label: "Nejlepší doba nákupu", value: "Právě teď", note: "Cena je nyní nízko." },
    { icon: "clock" as const, label: "Poslední změna ceny", value: "před 2 dny", note: "Cena klesla v posledních datech." },
    { icon: "store" as const, label: "Počet obchodů", value: `${product.sellers.length} nabídek`, note: "Porovnáváme aktivní e-shopy." },
    { icon: "thumbsUp" as const, label: "Doporučení", value: stats.minimum === product.latestPrice ? "Nakoupit nyní" : "Sledovat cenu", note: "Cena je vyhodnocená z historie." },
  ];

  return (
    <section>
      <h2 className="mb-5 text-2xl font-extrabold text-navy">Cenové statistiky</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <Icon name={card.icon} className="h-8 w-8 text-primary" />
            <p className="mt-3 text-sm font-bold text-muted">{card.label}</p>
            <p className="mt-1 text-xl font-black text-primary">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-muted">{card.note}</p>
          </article>
        ))}
      </div>
      <p className="sr-only">{formatPrice(stats.minimum, product.currency ?? undefined, locale)}</p>
    </section>
  );
};

const QuickSummary = ({ product, locale }: { product: ProductSeries; locale: "cs" | "en" }) => (
  <aside className="rounded-lg border border-line bg-white p-6 shadow-sm">
    <h2 className="text-lg font-extrabold text-navy">Rychlé shrnutí</h2>
    <div className="mt-5 space-y-5">
      <div className="flex items-center gap-4">
        <Icon name="tag" className="h-9 w-9 text-primary" />
        <div>
          <p className="font-extrabold text-navy">Nejlepší cena dnes</p>
          <p className="text-sm font-bold text-primary">{formatPrice(product.latestPrice, product.currency ?? undefined, locale) ?? "Čekáme na cenu"}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Icon name="barChart" className="h-9 w-9 text-primary" />
        <div>
          <p className="font-extrabold text-navy">Cena klesá</p>
          <p className="text-sm text-muted">podle posledních záznamů</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Icon name="store" className="h-9 w-9 text-primary" />
        <div>
          <p className="font-extrabold text-navy">Skladem dle e-shopů</p>
          <p className="text-sm text-muted">{product.availabilityLabel ?? `${product.sellers.length} aktivních nabídek`}</p>
        </div>
      </div>
    </div>
  </aside>
);

export const ProductDetailPage = ({ productSlug, onNavigateToProduct, onNavigateHome, onNavigatePath, activePath }: ProductDetailPageProps) => {
  const { t, locale } = useTranslation();
  const { product, loading, error, reload } = useProductDetail(productSlug);
  const searchState = useSearchOverlayState(INLINE_SEARCH_LIMIT);
  const { setSearchActive } = searchState;

  useEffect(() => {
    setSearchActive(false);
  }, [productSlug, setSearchActive]);

  const canonicalPath = useMemo(() => `/deskove-hry/${encodeURIComponent(productSlug)}`, [productSlug]);
  const seoDescription = useMemo(() => (product ? buildProductDescription(product, locale) : null), [locale, product]);
  const structuredData = useMemo(() => {
    if (!product || !seoDescription) return null;
    const canonicalUrl = buildAbsoluteUrl(canonicalPath) ?? canonicalPath;
    return buildProductStructuredData(product, canonicalUrl, locale, seoDescription);
  }, [canonicalPath, locale, product, seoDescription]);
  const ogImage = useMemo(() => (product ? pickPrimaryImage(product) : null), [product]);
  const keywords = useMemo(() => (product ? [product.label, ...product.categoryTags].slice(0, 8) : undefined), [product]);
  const pageTitle = product ? `${product.label} | Deskovky Levně` : "Deskovky Levně | Srovnávač cen deskových her";

  return (
    <div className="min-h-screen bg-background text-navy">
      <Seo title={pageTitle} description={seoDescription ?? "Sledujte vývoj ceny a dostupnosti českých deskových her."} path={canonicalPath} imageUrl={ogImage} locale={locale} type={product ? "product" : "website"} noIndex={!product || Boolean(error)} keywords={keywords} structuredData={structuredData ?? undefined} />
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
      <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          {loading ? <LoadingState /> : null}
          {error ? <ErrorState message={error} retryLabel={t("retry")} onRetry={reload} /> : null}
          {!loading && !error && !product ? <EmptyState message={t("detailNotFoundDescription", { code: productSlug })} /> : null}
          {product ? (
            <>
              <section className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_260px]">
                <ProductGallery series={product} />
                <ProductHero series={product} locale={locale} t={t} />
                <QuickSummary product={product} locale={locale} />
              </section>

              <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-extrabold text-navy">Historie ceny</h2>
                  <div className="flex gap-2 text-xs font-bold text-muted">
                    {["1M", "3M", "6M", "1R", "MAX"].map((range) => (
                      <span key={range} className={`rounded-md border px-3 py-1 ${range === "6M" ? "border-primary bg-emerald-50 text-primary" : "border-line"}`}>
                        {range}
                      </span>
                    ))}
                  </div>
                </div>
                <ProductChart series={product} locale={locale} priceLabel={t("price")} dateLabel={t("date")} />
              </section>

              <section>
                <h2 className="mb-5 text-2xl font-extrabold text-navy">Kde koupit nejlevněji</h2>
                <SellerOfferTable series={product} locale={locale} />
              </section>

              <PriceStatsCards product={product} locale={locale} />

              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <article className="rounded-lg border border-line bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-extrabold text-navy">O hře</h2>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
                    {product.shortDescription ?? "Popis hry zatím není v datech dostupný."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {product.categoryTags.slice(0, 6).map((category) => (
                      <span key={category} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-primary">
                        {category}
                      </span>
                    ))}
                  </div>
                </article>
                <article className="rounded-lg border border-line bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-extrabold text-navy">Základní informace</h2>
                  <SupplementaryParametersPanel parameters={product.supplementaryParameters} t={t} />
                </article>
                <article className="rounded-lg border border-line bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-extrabold text-navy">Obsah balení</h2>
                  <ul className="mt-4 list-disc space-y-3 pl-5 text-sm font-semibold text-muted">
                    <li>{product.galleryImages?.length ?? 0} obrázků v galerii</li>
                    <li>{product.sellers.length} prodejců</li>
                    <li>{product.categoryTags.length} kategorií</li>
                  </ul>
                </article>
              </section>

              <CtaBanner title="Hlídáte cenu této hry?" subtitle="Jakmile cena klesne, dáme vám vědět e-mailem." actionLabel="Zapnout hlídání" href={canonicalPath} />
            </>
          ) : null}
        </div>
      </main>
      <AppFooter />
    </div>
  );
};

export default ProductDetailPage;
