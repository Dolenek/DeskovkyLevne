import { useCallback } from "react";
import type { ReactNode } from "react";
import type { ProductSearchResult } from "../types/product";
import { formatPrice } from "../utils/numberFormat";
import type { TranslationHook } from "../hooks/useTranslation";
import { useSearchOverlayKeyboard } from "../hooks/useSearchOverlayKeyboard";
import { SearchOverlaySkeleton } from "./skeleton";
import { Icon } from "./ui/Icon";
import { SearchKeyboardHints } from "./search-overlay/SearchKeyboardHints";
import { SearchOverlayResultsList } from "./search-overlay/SearchOverlayResultsList";

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

type OverlayContentProps = Omit<ProductSearchOverlayProps, "visible" | "onClose"> & {
  activeIndex: number;
  onActivateIndex: (index: number) => void;
};

const renderOverlayContent = ({
  loading,
  error,
  results,
  query,
  locale,
  t,
  onRetry,
  onSelect,
  activeIndex,
  onActivateIndex,
}: OverlayContentProps): ReactNode => {
  if (loading) {
    return <SearchOverlaySkeleton />;
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
  return (
    <SearchOverlayResultsList
      results={results}
      activeIndex={activeIndex}
      locale={locale}
      onActivateIndex={onActivateIndex}
      onSelect={onSelect}
    />
  );
};

export const ProductSearchOverlay = ({
  visible,
  onClose,
  ...contentProps
}: ProductSearchOverlayProps) => {
  const { results, loading, error, onSelect } = contentProps;
  const handleSelectActive = useCallback(
    (index: number) => {
      const selectedResult = results[index];
      if (selectedResult) {
        onSelect(selectedResult);
      }
    },
    [onSelect, results]
  );
  const selectableCount = loading || error ? 0 : results.length;
  const { activeIndex, setActiveIndex } = useSearchOverlayKeyboard({
    visible,
    resultCount: selectableCount,
    onSelectActive: handleSelectActive,
    onClose,
  });

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center px-4 pt-28 sm:px-6 lg:px-10 lg:pt-24">
      <button
        type="button"
        className="absolute inset-0 bg-navy/20 backdrop-blur-sm"
        onClick={onClose}
        aria-label={contentProps.t("searchOverlayClose")}
      />
      <div className="relative z-10 flex max-h-[calc(100vh-8.5rem)] w-full max-w-3xl flex-col rounded-lg border border-line bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-extrabold text-navy">
          <Icon name="search" className="h-4 w-4 text-primary" />
          {contentProps.t("searchResultsTitle")}
        </div>
        <div className="overflow-y-auto pr-1">
          {renderOverlayContent({
            ...contentProps,
            activeIndex,
            onActivateIndex: setActiveIndex,
          })}
        </div>
        <SearchKeyboardHints t={contentProps.t} />
      </div>
    </div>
  );
};
