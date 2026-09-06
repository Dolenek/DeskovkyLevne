import { useEffect, useRef } from "react";
import { EmptyState, ErrorState } from "../../components/AsyncStates";
import { ProductTile } from "../../components/ProductTile";
import { CatalogSkeleton } from "../../components/skeleton";
import type { TranslationHook } from "../../hooks/useTranslation";
import type { ActiveFilterChip } from "../../types/filters";
import type { ProductSeries } from "../../types/product";
import { CatalogPagination } from "./CatalogPagination";
import { ActiveFilters } from "./ActiveFilters";

export const FILTERED_PAGE_SIZE = 10;
export interface FilteredProductsSectionProps {
  query?: string;
  series: ProductSeries[];
  total: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
  locale: TranslationHook["locale"];
  t: TranslationHook["t"];
  activeFilterChips: ActiveFilterChip[];
  page: number;
  onResetFilters: () => void;
  onRemoveFilter: (key: string) => void;
  onPageChange: (page: number) => void;
  onNavigateToSeries: (series: ProductSeries) => void;
}

const CatalogResults = (props: FilteredProductsSectionProps) => {
  const { loading, error, reload, t, total, query, series, locale, onNavigateToSeries } = props;
  if (loading) return <CatalogSkeleton itemCount={FILTERED_PAGE_SIZE} />;
  if (error) return <ErrorState message={error} retryLabel={t("retry")} onRetry={reload} />;
  if (total === 0)
    return <EmptyState message={query ? t("searchNoResults", { term: query }) : t("filteredResultsEmpty")} />;
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {series.map((entry) => (
        <ProductTile
          key={entry.slug}
          series={entry}
          locale={locale}
          t={t}
          onNavigate={() => onNavigateToSeries(entry)}
        />
      ))}
    </div>
  );
};

export const FilteredProductsSection = (props: FilteredProductsSectionProps) => {
  const { total, loading, error, page, activeFilterChips, onRemoveFilter, onResetFilters, t, locale } = props;
  const count = Math.max(1, Math.ceil(total / FILTERED_PAGE_SIZE));
  const { sectionRef, changePage } = useCatalogPaginationScroll(props, count);
  return (
    <section
      ref={sectionRef}
      aria-busy={loading}
      className="flex scroll-mt-36 flex-col gap-4 lg:scroll-mt-24"
    >
      <ActiveFilters chips={activeFilterChips} onRemove={onRemoveFilter} onReset={onResetFilters} t={t} />
      {!loading && !error ? (
        <h2 aria-live="polite" className="text-xl font-extrabold">
          {t("filteredResultsShowing", {
            from: total ? (page - 1) * FILTERED_PAGE_SIZE + 1 : 0,
            to: Math.min(page * FILTERED_PAGE_SIZE, total),
            total: total.toLocaleString(locale === "cs" ? "cs-CZ" : "en-US"),
          })}
        </h2>
      ) : null}
      <CatalogResults {...props} />
      {!loading && !error ? (
        <CatalogPagination page={page} count={count} onChange={changePage} t={t} />
      ) : null}
    </section>
  );
};

const useCatalogPaginationScroll = (
  { loading, error, page, onPageChange }: FilteredProductsSectionProps,
  count: number,
) => {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldScroll = useRef(false);
  useEffect(() => {
    if (!loading && !error && page > count) onPageChange(count);
    if (!loading && shouldScroll.current) {
      sectionRef.current?.scrollIntoView({ block: "start" });
      shouldScroll.current = false;
    }
  }, [loading, error, page, count, onPageChange]);
  const changePage = (next: number) => {
    shouldScroll.current = true;
    onPageChange(next);
  };
  return { sectionRef, changePage };
};
