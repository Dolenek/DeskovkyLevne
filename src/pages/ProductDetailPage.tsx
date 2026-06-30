import { useEffect, useMemo } from "react";
import { EmptyState, ErrorState } from "../components/AsyncStates";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { ProductDetailSkeleton } from "../components/skeleton";
import { ProductDataSummary } from "../components/product-detail/ProductDataSummary";
import { ProductGallery } from "../components/product-detail/ProductGallery";
import { ProductHero } from "../components/product-detail/ProductHero";
import { ProductPriceStats } from "../components/product-detail/ProductPriceStats";
import { ProductQuickSummary } from "../components/product-detail/ProductQuickSummary";
import { PriceHistorySection } from "../components/product-detail/PriceHistorySection";
import { SupplementaryParametersPanel } from "../components/product-detail/SupplementaryParametersPanel";
import { SellerOfferTable } from "../components/SellerOfferTable";
import { Seo } from "../components/Seo";
import { AppFooter } from "../components/ui/AppFooter";
import { useSearchOverlayState } from "../hooks/useSearchOverlayState";
import { useTranslation } from "../hooks/useTranslation";
import { useProductDetail } from "../hooks/useProductDetail";
import { buildProductDescription, buildProductStructuredData, pickPrimaryImage } from "../utils/productSeo";
import { buildAbsoluteUrl } from "../utils/urls";

interface ProductDetailPageProps {
  productSlug: string;
  onNavigateToProduct: (productSlug: string) => void;
  onNavigateHome: () => void;
  onNavigatePath: (path: string) => void;
  activePath: string;
}

const INLINE_SEARCH_LIMIT = 6;
const OFFERS_SECTION_ID = "nabidky";

export const ProductDetailPage = ({
  productSlug,
  onNavigateToProduct,
  onNavigateHome,
  onNavigatePath,
  activePath,
}: ProductDetailPageProps) => {
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
      <Seo
        title={pageTitle}
        description={seoDescription ?? t("detailSeoFallback")}
        path={canonicalPath}
        imageUrl={ogImage}
        locale={locale}
        type={product ? "product" : "website"}
        noIndex={!product || Boolean(error)}
        keywords={keywords}
        structuredData={structuredData ?? undefined}
      />
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
          {loading ? <ProductDetailSkeleton /> : null}
          {error ? <ErrorState message={error} retryLabel={t("retry")} onRetry={reload} /> : null}
          {!loading && !error && !product ? <EmptyState message={t("detailNotFoundDescription", { code: productSlug })} /> : null}
          {product ? (
            <>
              <section className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_260px]">
                <ProductGallery series={product} />
                <ProductHero series={product} locale={locale} offersSectionId={OFFERS_SECTION_ID} t={t} />
                <ProductQuickSummary product={product} locale={locale} t={t} />
              </section>

              <PriceHistorySection
                series={product}
                locale={locale}
                priceLabel={t("price")}
                dateLabel={t("date")}
                t={t}
              />

              <section id={OFFERS_SECTION_ID} className="scroll-mt-28">
                <h2 className="mb-5 text-2xl font-extrabold text-navy">{t("detailOffersTitle")}</h2>
                <SellerOfferTable series={product} locale={locale} />
              </section>

              <ProductPriceStats product={product} locale={locale} t={t} />

              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <article className="rounded-lg border border-line bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-extrabold text-navy">{t("detailDescriptionTitle")}</h2>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
                    {product.shortDescription ?? t("detailDescriptionEmpty")}
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
                  <h2 className="mb-4 text-xl font-extrabold text-navy">{t("detailBasicInfoTitle")}</h2>
                  <SupplementaryParametersPanel parameters={product.supplementaryParameters} t={t} />
                </article>
                <ProductDataSummary product={product} t={t} />
              </section>
            </>
          ) : null}
        </div>
      </main>
      <AppFooter />
    </div>
  );
};

export default ProductDetailPage;
