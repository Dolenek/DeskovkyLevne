import type { ProductSearchResult } from "../types/product";
import { formatPrice } from "../utils/numberFormat";
import type { TranslationHook } from "../hooks/useTranslation";
import type { ReactNode } from "react";

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

const getSeriesImage = (series: ProductSearchResult): string | null => {
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
  results: ProductSearchResult[];
  locale: Parameters<typeof formatPrice>[2];
  onSelect: (series: ProductSearchResult) => void;
}) => (
  <ul className="space-y-2">
    {results.map((series) => (
      <li key={series.slug}>
        <button
          type="button"
          onClick={() => onSelect(series)}
          className="flex w-full flex-col gap-3 rounded-2xl border border-outline bg-surface/80 px-4 py-3 text-left transition hover:border-primary hover:bg-white sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            {(() => {
              const image = getSeriesImage(series);
              const fallbackLabel =
                series.label?.charAt(0).toUpperCase() ||
                series.slug.charAt(0).toUpperCase();
              return image ? (
                <img
                  src={image}
                  alt={series.label}
                  className="h-14 w-14 rounded-2xl border border-outline object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-outline bg-surface-muted text-lg font-semibold text-muted">
                  {fallbackLabel}
                </div>
              );
            })()}
            <div>
              <p className="text-base font-semibold text-ink">{series.label}</p>
              <p className="text-sm text-muted">
                {series.primaryProductCode ?? series.slug}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:gap-3 sm:text-right">
            {series.availabilityLabel ? (
              <span className="inline-flex rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
                {series.availabilityLabel}
              </span>
            ) : null}
            <span className="text-lg font-semibold text-ink">
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline border-t-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-accent">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-ink transition hover:bg-primary/15"
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

  const content = renderOverlayContent(contentProps);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center px-4 pt-24 sm:px-6 sm:pt-32 lg:px-10">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-w-3xl flex-col rounded-3xl border border-outline bg-surface/95 p-4 shadow-card max-h-[calc(100vh-7rem)] sm:max-h-[calc(100vh-10rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mb-3 text-center text-sm uppercase tracking-wide text-muted">
          {contentProps.t("searchResultsTitle")}
        </p>
        <div className="custom-scrollbar overflow-y-auto pr-1">
          {content}
        </div>
      </div>
    </div>
  );
};
