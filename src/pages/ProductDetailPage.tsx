import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useTranslation } from "../hooks/useTranslation";
import { useProductDetail } from "../hooks/useProductDetail";
import { useProductPricing } from "../hooks/useProductPricing";
import type { ProductSeries } from "../types/product";
import type { Translator } from "../types/i18n";
import { formatPrice } from "../utils/numberFormat";
import { searchSnapshotsByName } from "../services/productService";
import { uniqueSeriesBySlug } from "../utils/series";

interface ProductDetailPageProps {
  productSlug: string;
  onNavigateToProduct: (productSlug: string) => void;
  onNavigateHome: () => void;
}

const INLINE_SEARCH_LIMIT = 6;


interface PriceStats {
  lowest: number | null;
  highest: number | null;
  average: number | null;
}

const buildPriceStats = (series: ProductSeries | null): PriceStats => {
  if (!series || series.points.length === 0) {
    return { lowest: null, highest: null, average: null };
  }
  const prices = series.points.map((point) => point.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  return {
    lowest,
    highest,
    average: Number.isFinite(average) ? Number(average.toFixed(2)) : null,
  };
};

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-slate-800 bg-black/30 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-2xl font-semibold text-white">{value}</p>
  </div>
);

const PriceSummary = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries | null;
  locale: Parameters<typeof formatPrice>[2];
  t: Translator;
}) => {
  const stats = useMemo(() => buildPriceStats(series), [series]);
  if (!series) {
    return null;
  }
  const format = (price: number | null) =>
    formatPrice(price, series.currency ?? undefined, locale) || "--";

  return (
    <section className="rounded-3xl border border-slate-800 bg-surface/70 p-6 shadow-xl shadow-black/40 backdrop-blur">
      <h2 className="text-2xl font-semibold text-white">
        {t("detailPriceStatsTitle")}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <StatCard label={t("detailStatsLowest")} value={format(stats.lowest)} />
        <StatCard label={t("detailStatsHighest")} value={format(stats.highest)} />
        <StatCard label={t("detailStatsAverage")} value={format(stats.average)} />
      </div>
    </section>
  );
};

const HistorySection = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries;
  locale: Parameters<typeof formatPrice>[2];
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

  const searchLoader = useCallback(() => {
    if (debouncedQuery.length < 2) {
      return Promise.resolve([]);
    }
    return searchSnapshotsByName(debouncedQuery);
  }, [debouncedQuery]);

  const {
    series: searchSeries,
    loading: searchLoading,
    error: searchError,
    reload: reloadSearch,
  } = useProductPricing(searchLoader);

  useEffect(() => {
    setSearchActive(false);
  }, [productSlug]);

  const overlayResults = useMemo(() => {
    const unique = uniqueSeriesBySlug(searchSeries);
    return unique.slice(0, INLINE_SEARCH_LIMIT);
  }, [searchSeries]);
  const overlayVisible = searchActive && debouncedQuery.length >= 2;

  return (
    <div className="min-h-screen bg-background text-white">
      <AppHeader
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          if (!value.trim()) {
            setSearchActive(false);
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
              <PriceSummary series={product} locale={locale} t={t} />
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
