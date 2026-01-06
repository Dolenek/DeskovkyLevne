import { useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/AsyncStates";
import { ProductChart } from "../components/ProductChart";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { ProductGallery } from "../components/product-detail/ProductGallery";
import { ProductHero } from "../components/product-detail/ProductHero";
import { SupplementaryParametersPanel } from "../components/product-detail/SupplementaryParametersPanel";
import { Seo } from "../components/Seo";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useCatalogSearch } from "../hooks/useCatalogSearch";
import { useTranslation } from "../hooks/useTranslation";
import { useProductDetail } from "../hooks/useProductDetail";
import type { ProductSeries } from "../types/product";
import type { Translator } from "../types/i18n";
import type { LocaleKey } from "../i18n/translations";
import { uniqueSeriesBySlug } from "../utils/series";
import {
  buildProductDescription,
  buildProductStructuredData,
  pickPrimaryImage,
} from "../utils/productSeo";
import { buildAbsoluteUrl } from "../utils/urls";

interface ProductDetailPageProps {
  productSlug: string;
  onNavigateToProduct: (productSlug: string) => void;
  onNavigateHome: () => void;
}

const INLINE_SEARCH_LIMIT = 6;

const HistorySection = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries;
  locale: LocaleKey;
  t: Translator;
}) => (
  <section className="rounded-3xl border border-slate-800 bg-surface/70 p-6 shadow-xl shadow-black/40 backdrop-blur">
    <div className="flex flex-col gap-1">
      <h2 className="text-2xl font-semibold text-white">
        {t("detailHistoryTitle")}
      </h2>
      <p className="text-sm text-slate-400">
        {t("detailHistorySubtitle", {
          count: series.sellers.reduce(
            (sum, seller) => sum + seller.points.length,
            0
          ),
        })}
      </p>
    </div>
    <div className="mt-6">
      {series.points.length > 0 ? (
        <ProductChart
          series={series}
          locale={locale}
          priceLabel={t("price")}
          dateLabel={t("date")}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
          {t("detailTimelineEmpty")}
        </p>
      )}
    </div>
    <div className="mt-6">
      <SupplementaryParametersPanel
        parameters={series.supplementaryParameters}
        t={t}
      />
    </div>
  </section>
);


export const ProductDetailPage = ({
  productSlug,
  onNavigateToProduct,
  onNavigateHome,
}: ProductDetailPageProps) => {
  const { t, locale } = useTranslation();
  const { product, loading, error, reload } = useProductDetail(productSlug);
  const [searchValue, setSearchValue] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    reload: reloadSearch,
  } = useCatalogSearch({
    query: debouncedQuery,
    availabilityFilter: "all",
    limit: INLINE_SEARCH_LIMIT * 6,
  });

  useEffect(() => {
    setSearchActive(false);
  }, [productSlug]);

  const overlayResults = useMemo(() => {
    const unique = uniqueSeriesBySlug(searchResults);
    return unique.slice(0, INLINE_SEARCH_LIMIT);
  }, [searchResults]);
  const overlayVisible = searchActive && debouncedQuery.length >= 2;
  const canonicalPath = useMemo(
    () => `/deskove-hry/${encodeURIComponent(productSlug)}`,
    [productSlug]
  );
  const seoDescription = useMemo(
    () => (product ? buildProductDescription(product, locale) : null),
    [locale, product]
  );
  const structuredData = useMemo(() => {
    if (!product || !seoDescription) {
      return null;
    }
    const canonicalUrl = buildAbsoluteUrl(canonicalPath) ?? canonicalPath;
    return buildProductStructuredData(
      product,
      canonicalUrl,
      locale,
      seoDescription
    );
  }, [canonicalPath, locale, product, seoDescription]);
  const ogImage = useMemo(
    () => (product ? pickPrimaryImage(product) : null),
    [product]
  );
  const keywords = useMemo(
    () =>
      product ? [product.label, ...product.categoryTags].slice(0, 8) : undefined,
    [product]
  );
  const defaultDescription =
    locale === "en"
      ? "Track price history and availability for Czech board games."
      : "Sledujte vývoj ceny a dostupnosti českých deskových her.";
  const fallbackTitle =
    locale === "en"
      ? "Deskovky Levně | Board game price tracker"
      : "Deskovky Levně | Srovnávač cen deskových her";
  const pageTitle = product ? `${product.label} | Deskovky Levně` : fallbackTitle;
  const shouldNoIndex = !product || Boolean(error);

  return (
    <div className="min-h-screen bg-background text-white">
      <Seo
        title={pageTitle}
        description={seoDescription ?? defaultDescription}
        path={canonicalPath}
        imageUrl={ogImage}
        locale={locale}
        type={product ? "product" : "website"}
        noIndex={shouldNoIndex}
        keywords={keywords}
        structuredData={structuredData ?? undefined}
      />
      <AppHeader
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          if (!value.trim()) {
            setSearchActive(false);
          } else {
            setSearchActive(true);
          }
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
      <main className="px-4 pt-6 pb-10 sm:px-6 lg:px-10 lg:pt-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} retryLabel={t("retry")} onRetry={reload} />
          ) : product ? (
            <>
              <div className="grid gap-8 lg:grid-cols-2">
                <ProductGallery series={product} />
                <ProductHero series={product} locale={locale} t={t} />
              </div>
              <HistorySection series={product} locale={locale} t={t} />
            </>
          ) : (
            <EmptyState
              message={t("detailNotFoundDescription", { code: productSlug })}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductDetailPage;
