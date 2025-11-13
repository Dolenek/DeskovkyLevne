import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/AsyncStates";
import { ProductChart } from "../components/ProductChart";
import { AppHeader } from "../components/AppHeader";
import { ProductSearchOverlay } from "../components/ProductSearchOverlay";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useTranslation } from "../hooks/useTranslation";
import { useProductDetail } from "../hooks/useProductDetail";
import { useProductPricing } from "../hooks/useProductPricing";
import type { ProductSeries } from "../types/product";
import { formatPrice } from "../utils/numberFormat";
import { formatDateLabel } from "../utils/date";
import { searchSnapshotsByName } from "../services/productService";

type Translator = ReturnType<typeof useTranslation>["t"];

interface ProductDetailPageProps {
  productCode: string;
  onNavigateToProduct: (productCode: string) => void;
  onNavigateHome: () => void;
}

const INLINE_SEARCH_LIMIT = 6;

const toLargeImageUrl = (url: string): string => {
  if (!url) {
    return url;
  }
  if (url.includes("/related/")) {
    return url.replace("/related/", "/big/");
  }
  return url;
};

const ProductGallery = ({ series }: { series: ProductSeries }) => {
  const images = useMemo(() => {
    const unique = new Set<string>();
    const ordered: string[] = [];
    if (series.heroImage) {
      unique.add(series.heroImage);
      ordered.push(series.heroImage);
    }
    (series.galleryImages ?? []).forEach((url) => {
      if (url && !unique.has(url)) {
        unique.add(url);
        ordered.push(url);
      }
    });
    return ordered;
  }, [series.galleryImages, series.heroImage]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [series.productCode]);

  const activeImage = images[activeIndex];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
      <div className="flex h-[520px] w-full items-center justify-center rounded-2xl bg-slate-900/40">
        {activeImage ? (
          <img
            src={toLargeImageUrl(activeImage)}
            alt={`${series.label} - ${activeIndex + 1}`}
            className="max-h-[460px] w-full rounded-2xl object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-900 text-6xl font-bold text-slate-700">
            {series.label.charAt(0)}
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-20 w-20 flex-shrink-0 rounded-2xl border transition ${
                index === activeIndex
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={url}
                alt={`${series.label} thumbnail ${index + 1}`}
                className="h-full w-full rounded-2xl object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const ProductHero = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries;
  locale: Parameters<typeof formatDateLabel>[1];
  t: Translator;
}) => {
  const latestPrice = formatPrice(
    series.latestPrice,
    series.currency ?? undefined,
    locale
  );
  const lastUpdated = series.latestScrapedAt
    ? formatDateLabel(series.latestScrapedAt, locale)
    : "--";

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-800 bg-surface/70 p-6 shadow-2xl shadow-black/40 backdrop-blur">
      <p className="text-sm uppercase tracking-wide text-slate-400">
        {t("productCodeLabel")}
      </p>
      <h1 className="text-3xl font-semibold text-white">{series.label}</h1>
      <p className="text-sm text-slate-400">{series.productCode}</p>
      {series.availabilityLabel ? (
        <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          {series.availabilityLabel}
        </span>
      ) : null}
      <div className="mt-6 flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-700 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t("latestPrice")}
          </p>
          <p className="text-4xl font-semibold text-accent">{latestPrice}</p>
          {series.listPrice !== null ? (
            <p className="text-xs text-slate-400">
              {t("listPriceLabel")}:{" "}
              <span className="text-slate-200">
                {formatPrice(
                  series.listPrice,
                  series.currency ?? undefined,
                  locale
                )}
              </span>
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-700 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t("lastUpdated", { value: lastUpdated })}
          </p>
          {series.url ? (
            <a
              href={series.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/20"
            >
              {t("detailSourceLink")}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
};

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

const HistoryTable = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries;
  locale: Parameters<typeof formatDateLabel>[1];
  t: Translator;
}) => {
  const rows = useMemo(
    () => [...series.points].slice(-12).reverse(),
    [series.points]
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-slate-400">
        {t("detailTimelineEmpty")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-950/60 text-left text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("date")}</th>
            <th className="px-4 py-3 font-semibold text-right">{t("price")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 bg-black/20 text-white">
          {rows.map((point) => (
            <tr key={`${point.rawDate}-${point.price}`}>
              <td className="px-4 py-2">
                {formatDateLabel(point.rawDate, locale)}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-100">
                {formatPrice(point.price, series.currency ?? undefined, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        {t("detailHistorySubtitle", { count: series.points.length })}
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
      <HistoryTable series={series} locale={locale} t={t} />
    </div>
  </section>
);

export const ProductDetailPage = ({
  productCode,
  onNavigateToProduct,
  onNavigateHome,
}: ProductDetailPageProps) => {
  const { t, locale } = useTranslation();
  const { product, loading, error, reload } = useProductDetail(productCode);
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
  }, [productCode]);

  const overlayResults = useMemo(
    () => searchSeries.slice(0, INLINE_SEARCH_LIMIT),
    [searchSeries]
  );
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
          onNavigateToProduct(series.productCode);
        }}
        onClose={() => setSearchActive(false)}
      />
      <main className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          {loading ? (
            <LoadingState message={t("loading")} />
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
              message={t("detailNotFoundDescription", { code: productCode })}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductDetailPage;
