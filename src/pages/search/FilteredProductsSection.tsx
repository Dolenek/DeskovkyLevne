import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncStates";
import { ProductTile } from "../../components/ProductTile";
import type { TranslationHook } from "../../hooks/useTranslation";
import type { ProductSeries } from "../../types/product";
import { Icon } from "../../components/ui/Icon";

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
}

const benefits = [
  ["barChart", "Historie cen u každé hry", "Sledujte vývoj cen v čase a nakupte chytře."],
  ["store", "Porovnání nabídek e-shopů", "Najděte nejnižší cenu mezi desítkami obchodů."],
  ["bell", "Upozornění na pokles ceny", "Dáme vám vědět, když cena vaší hry klesne."],
] as const;

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
}: FilteredProductsSectionProps) => {
  const pageCount = Math.max(1, Math.ceil(total / FILTERED_PAGE_SIZE));
  const pageSeries = series.slice(0, FILTERED_PAGE_SIZE);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} retryLabel={t("retry")} onRetry={reload} />;
  if (total === 0) return <EmptyState message={t("filteredResultsEmpty")} />;

  const minLabel = priceRange.min !== null ? `${priceRange.min} Kč` : t("priceFilterAny");
  const maxLabel = priceRange.max !== null ? `${priceRange.max} Kč` : t("priceFilterAny");
  const showingFrom = (page - 1) * FILTERED_PAGE_SIZE + 1;
  const showingTo = Math.min(page * FILTERED_PAGE_SIZE, total);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-navy">
              Zobrazeno {showingFrom}-{showingTo} z {total.toLocaleString("cs-CZ")} her
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-primary">
                {minLabel} - {maxLabel}
              </span>
              <button type="button" className="px-2 py-2 text-sm font-bold text-primary">
                Vymazat vše
              </button>
            </div>
          </div>
          <select className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-navy outline-none focus:border-primary">
            <option>Nejvýhodnější ceny</option>
            <option>Nejnovější v katalogu</option>
          </select>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {benefits.map(([icon, title, body]) => (
              <div key={title} className="flex items-center gap-4 border-line md:border-r last:border-r-0">
                <Icon name={icon} className="h-9 w-9 text-primary" />
                <div>
                  <p className="font-extrabold text-navy">{title}</p>
                  <p className="text-sm text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {pageSeries.map((entry) => (
          <ProductTile key={entry.slug} series={entry} locale={locale} onNavigate={() => onNavigateToSeries(entry)} />
        ))}
      </div>

      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onPageChange(Math.min(page + 1, pageCount))}
        className="rounded-lg border border-dashed border-line bg-white px-4 py-4 text-sm font-extrabold text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Načíst více
      </button>

      {total > FILTERED_PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-muted disabled:opacity-40">
            Předchozí
          </button>
          {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`h-10 w-10 rounded-lg border text-sm font-extrabold ${
                pageNumber === page ? "border-primary bg-primary text-white" : "border-line bg-white text-navy"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-muted disabled:opacity-40">
            Další
          </button>
        </div>
      ) : null}
    </section>
  );
};
