import { useEffect, useMemo } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncStates";
import { ProductListItem } from "../../components/ProductListItem";
import type { TranslationHook } from "../../hooks/useTranslation";
import type { ProductSeries } from "../../types/product";

const PAGE_SIZE = 10;

const isSeriesAvailable = (series: ProductSeries): boolean => {
  const label = series.availabilityLabel?.toLowerCase() ?? "";
  return label.includes("sklad");
};

export interface FilteredProductsSectionProps {
  series: ProductSeries[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  locale: TranslationHook["locale"];
  t: TranslationHook["t"];
  priceRange: { min: number | null; max: number | null };
  onlyAvailable: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onNavigateToSeries: (series: ProductSeries) => void;
  selectedSeries: ProductSeries | null;
  onSelectSeries: (series: ProductSeries) => void;
}

export const FilteredProductsSection = ({
  series,
  loading,
  error,
  reload,
  locale,
  t,
  priceRange,
  onlyAvailable,
  page,
  onPageChange,
  onNavigateToSeries,
  selectedSeries,
  onSelectSeries,
}: FilteredProductsSectionProps) => {
  const filteredSeries = useMemo(() => {
    return series.filter((entry) => {
      if (onlyAvailable && !isSeriesAvailable(entry)) {
        return false;
      }
      const price = entry.latestPrice ?? entry.firstPrice ?? null;
      if (price === null) {
        return false;
      }
      if (priceRange.min !== null && price < priceRange.min) {
        return false;
      }
      if (priceRange.max !== null && price > priceRange.max) {
        return false;
      }
      return true;
    });
  }, [series, priceRange.min, priceRange.max, onlyAvailable]);

  const rawPageCount = Math.ceil(filteredSeries.length / PAGE_SIZE);
  const pageCount = Math.max(1, rawPageCount);

  useEffect(() => {
    if (page > pageCount) {
      onPageChange(pageCount);
    }
  }, [page, pageCount, onPageChange]);

  const pagedSeries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSeries.slice(start, start + PAGE_SIZE);
  }, [filteredSeries, page]);

  if (loading) {
    return <LoadingState message={t("loading")} />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        retryLabel={t("retry")}
        onRetry={reload}
      />
    );
  }

  if (filteredSeries.length === 0) {
    return <EmptyState message={t("filteredResultsEmpty")} />;
  }

  const minLabel =
    priceRange.min !== null ? priceRange.min.toString() : t("priceFilterAny");
  const maxLabel =
    priceRange.max !== null ? priceRange.max.toString() : t("priceFilterAny");
  const showingFrom = (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filteredSeries.length);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          {t("filteredResultsTitle")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("filteredResultsSubtitle", { min: minLabel, max: maxLabel })}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {pagedSeries.map((entry) => (
          <ProductListItem
            key={entry.productCode}
            series={entry}
            locale={locale}
            selected={selectedSeries?.productCode === entry.productCode}
            onSelect={onSelectSeries}
            onNavigate={onNavigateToSeries}
          />
        ))}
      </div>
      {filteredSeries.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            {t("filteredPaginationLabel", {
              from: showingFrom,
              to: showingTo,
              total: filteredSeries.length,
            })}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary hover:text-white"
            >
              {t("filteredPaginationPrev")}
            </button>
            <span className="text-sm text-slate-400">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page === pageCount}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary hover:text-white"
            >
              {t("filteredPaginationNext")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};
