import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncStates";
import { ProductListItem } from "../../components/ProductListItem";
import type { TranslationHook } from "../../hooks/useTranslation";
import type { ProductSeries } from "../../types/product";

export const FILTERED_PAGE_SIZE = 10;

export interface FilteredProductsSectionProps {
  series: ProductSeries[];
  total: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
  locale: TranslationHook["locale"];
  t: TranslationHook["t"];
  priceRange: { min: number | null; max: number | null };
  page: number;
  onPageChange: (page: number) => void;
  onNavigateToSeries: (series: ProductSeries) => void;
  selectedSeries: ProductSeries | null;
  onSelectSeries: (series: ProductSeries) => void;
}

export const FilteredProductsSection = ({
  series,
  total,
  loading,
  error,
  reload,
  locale,
  t,
  priceRange,
  page,
  onPageChange,
  onNavigateToSeries,
  selectedSeries,
  onSelectSeries,
}: FilteredProductsSectionProps) => {
  const rawPageCount = Math.ceil(total / FILTERED_PAGE_SIZE);
  const pageCount = Math.max(1, rawPageCount);
  const pageSeries = series.slice(0, FILTERED_PAGE_SIZE);

  if (loading) {
    return <LoadingState />;
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

  if (total === 0) {
    return <EmptyState message={t("filteredResultsEmpty")} />;
  }

  const minLabel =
    priceRange.min !== null ? priceRange.min.toString() : t("priceFilterAny");
  const maxLabel =
    priceRange.max !== null ? priceRange.max.toString() : t("priceFilterAny");
  const showingFrom = (page - 1) * FILTERED_PAGE_SIZE + 1;
  const showingTo = Math.min(page * FILTERED_PAGE_SIZE, total);

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
        {pageSeries.map((entry) => (
          <ProductListItem
            key={entry.slug}
            series={entry}
            locale={locale}
            selected={selectedSeries?.slug === entry.slug}
            onSelect={onSelectSeries}
            onNavigate={onNavigateToSeries}
          />
        ))}
      </div>
      {total > FILTERED_PAGE_SIZE ? (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            {t("filteredPaginationLabel", {
              from: showingFrom,
              to: showingTo,
              total,
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
