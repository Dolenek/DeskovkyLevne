import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncStates";
import { ProductListItem } from "../../components/ProductListItem";
import type { TranslationHook } from "../../hooks/useTranslation";
import type { ProductSeries } from "../../types/product";
import type { AvailabilityFilter } from "../../types/filters";

export interface SearchResultsSectionProps {
  query: string;
  loading: boolean;
  error: string | null;
  series: ProductSeries[];
  displayCount: number;
  maxCount: number;
  availabilityFilter: AvailabilityFilter;
  selectedSeries: ProductSeries | null;
  onSelectSeries: (series: ProductSeries) => void;
  locale: TranslationHook["locale"];
  t: TranslationHook["t"];
  reload: () => void;
  onNavigateToSeries: (series: ProductSeries) => void;
}

export const SearchResultsSection = ({
  query,
  loading,
  error,
  series,
  displayCount,
  maxCount,
  availabilityFilter,
  selectedSeries,
  onSelectSeries,
  locale,
  t,
  reload,
  onNavigateToSeries,
}: SearchResultsSectionProps) => {
  if (query.length < 2) {
    return <EmptyState message={t("searchStartTyping")} />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={t("errorTitle")}
        retryLabel={t("retry")}
        onRetry={reload}
      />
    );
  }

  if (series.length === 0) {
    return <EmptyState message={t("searchNoResults", { term: query })} />;
  }

  const filterLabel =
    availabilityFilter === "available"
      ? t("availabilityFilterOn")
      : availabilityFilter === "preorder"
        ? t("availabilityFilterPreorder")
        : null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          {t("searchResultsTitle")}
        </h2>
        <p className="text-sm text-slate-400">
          {displayCount} / {maxCount}
        </p>
        {filterLabel ? (
          <p className="mt-1 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {filterLabel}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        {series.map((entry) => (
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
    </section>
  );
};
