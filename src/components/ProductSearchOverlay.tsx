import type { ProductSeries } from "../types/product";
import { formatPrice } from "../utils/numberFormat";
import type { TranslationHook } from "../hooks/useTranslation";
import type { ReactNode } from "react";

interface ProductSearchOverlayProps {
  visible: boolean;
  loading: boolean;
  error: string | null;
  results: ProductSeries[];
  query: string;
  locale: Parameters<typeof formatPrice>[2];
  t: TranslationHook["t"];
  onRetry: () => void;
  onSelect: (series: ProductSeries) => void;
  onClose: () => void;
}

type OverlayContentProps = Omit<ProductSearchOverlayProps, "visible" | "onClose">;

const getSeriesImage = (series: ProductSeries): string | null => {
  if (series.heroImage) {
    return series.heroImage;
  }
  if (series.galleryImages && series.galleryImages.length > 0) {
    return series.galleryImages[0] ?? null;
  }
  return null;
};

const OverlayResultsList = ({
  results,
  locale,
  onSelect,
}: {
  results: ProductSeries[];
  locale: Parameters<typeof formatPrice>[2];
  onSelect: (series: ProductSeries) => void;
}) => (
  <ul className="space-y-2">
    {results.map((series) => (
      <li key={series.productCode}>
        <button
          type="button"
          onClick={() => onSelect(series)}
          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-black/30 px-4 py-3 text-left transition hover:border-primary hover:bg-black/60"
        >
          <div className="flex items-center gap-4">
            {(() => {
              const image = getSeriesImage(series);
              const fallbackLabel =
                series.label?.charAt(0).toUpperCase() || series.productCode[0];
              return image ? (
                <img
                  src={image}
                  alt={series.label}
                  className="h-14 w-14 rounded-2xl border border-slate-800 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900 text-lg font-semibold text-slate-500">
                  {fallbackLabel}
                </div>
              );
            })()}
            <div>
              <p className="text-base font-semibold text-white">{series.label}</p>
              <p className="text-sm text-slate-400">{series.productCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            {series.availabilityLabel ? (
              <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                {series.availabilityLabel}
              </span>
            ) : null}
            <span className="text-lg font-semibold text-accent">
              {formatPrice(
                series.latestPrice,
                series.currency ?? undefined,
                locale
              ) ?? "--"}
            </span>
          </div>
        </button>
      </li>
    ))}
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/20"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
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

  const content = renderOverlayContent(contentProps);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center px-4 pt-32 sm:px-6 lg:px-10">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mb-3 text-center text-sm uppercase tracking-wide text-slate-400">
          {contentProps.t("searchResultsTitle")}
        </p>
        {content}
      </div>
    </div>
  );
};
