import type { ReactNode } from "react";
import type { ProductSearchResult } from "../types/product";
import { formatPrice } from "../utils/numberFormat";
import type { TranslationHook } from "../hooks/useTranslation";
import { Icon } from "./ui/Icon";

interface ProductSearchOverlayProps {
  visible: boolean;
  loading: boolean;
  error: string | null;
  results: ProductSearchResult[];
  query: string;
  locale: Parameters<typeof formatPrice>[2];
  t: TranslationHook["t"];
  onRetry: () => void;
  onSelect: (series: ProductSearchResult) => void;
  onClose: () => void;
}

type OverlayContentProps = Omit<ProductSearchOverlayProps, "visible" | "onClose">;

const getSeriesImage = (series: ProductSearchResult): string | null =>
  series.heroImage ?? series.galleryImages?.[0] ?? null;

const OverlayResultsList = ({
  results,
  locale,
  onSelect,
}: {
  results: ProductSearchResult[];
  locale: Parameters<typeof formatPrice>[2];
  onSelect: (series: ProductSearchResult) => void;
}) => (
  <ul className="space-y-2">
    {results.map((series) => {
      const image = getSeriesImage(series);
      const fallbackLabel =
        series.label?.charAt(0).toUpperCase() || series.slug.charAt(0).toUpperCase();
      return (
        <li key={series.slug}>
          <button
            type="button"
            onClick={() => onSelect(series)}
            className="flex w-full flex-col gap-3 rounded-lg border border-line bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              {image ? (
                <img
                  src={image}
                  alt={series.label}
                  className="h-14 w-14 rounded-lg border border-line object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-line bg-slate-50 text-lg font-semibold text-muted">
                  {fallbackLabel}
                </div>
              )}
              <div>
                <p className="text-base font-extrabold text-navy">{series.label}</p>
                <p className="text-sm text-muted">
                  {series.primaryProductCode ?? series.slug}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {series.availabilityLabel ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-primary">
                  {series.availabilityLabel}
                </span>
              ) : null}
              <span className="text-lg font-extrabold text-primary">
                {formatPrice(series.latestPrice, series.currency ?? undefined, locale) ??
                  "--"}
              </span>
            </div>
          </button>
        </li>
      );
    })}
  </ul>
);

const renderOverlayContent = ({
  loading,
  error,
  results,
  query,
  locale,
  t,
  onRetry,
  onSelect,
}: OverlayContentProps): ReactNode => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-rose-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        {t("searchNoResults", { term: query })}
      </p>
    );
  }
  return <OverlayResultsList results={results} locale={locale} onSelect={onSelect} />;
};

export const ProductSearchOverlay = ({
  visible,
  onClose,
  ...contentProps
}: ProductSearchOverlayProps) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center px-4 pt-28 sm:px-6 lg:px-10 lg:pt-24">
      <button
        type="button"
        className="absolute inset-0 bg-navy/20 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Zavřít vyhledávání"
      />
      <div className="relative z-10 flex max-h-[calc(100vh-8.5rem)] w-full max-w-3xl flex-col rounded-lg border border-line bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-extrabold text-navy">
          <Icon name="search" className="h-4 w-4 text-primary" />
          {contentProps.t("searchResultsTitle")}
        </div>
        <div className="overflow-y-auto pr-1">{renderOverlayContent(contentProps)}</div>
      </div>
    </div>
  );
};
