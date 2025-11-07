import { useCallback, useEffect, useMemo, useState } from "react";
import { DiscountCard } from "./components/DiscountCard";
import { LocaleSwitcher } from "./components/LocaleSwitcher";
import { ProductCard } from "./components/ProductCard";
import { ProductListItem } from "./components/ProductListItem";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useProductPricing } from "./hooks/useProductPricing";
import { useRecentDiscounts } from "./hooks/useRecentDiscounts";
import { useTranslation, type TranslationHook } from "./hooks/useTranslation";
import { searchSnapshotsByName } from "./services/productService";
import type { ProductSeries } from "./types/product";

const MAX_SEARCH_SERIES = Number(
  import.meta.env.VITE_SEARCH_MAX_SERIES ?? "6"
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-300">
    {message}
  </div>
);

const ErrorState = ({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) => (
  <div className="rounded-3xl border border-rose-900 bg-rose-950/40 p-10 text-center text-rose-200">
    <p className="mb-4 font-semibold">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-full bg-primary px-6 py-2 font-medium text-white transition hover:drop-shadow-glow"
    >
      {retryLabel}
    </button>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-300">
    {message}
  </div>
);

const Header = ({
  searchValue,
  onSearchChange,
  t,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  t: TranslationHook["t"];
}) => (
  <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-black/95 shadow-lg shadow-black/60">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-white sm:flex-row sm:items-center sm:gap-8">
      <div className="text-xl font-bold uppercase tracking-[0.3em]">
        Tlama Prices
      </div>
      <div className="flex-1">
        <div className="mx-auto flex max-w-xl justify-center">
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-slate-700 bg-black/40 px-4 py-3 text-center text-base font-semibold text-white outline-none transition focus:border-primary focus:shadow-[0_0_0_2px_rgba(76,144,255,0.4)]"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
    </div>
  </header>
);

const SearchResultsSection = ({
  query,
  loading,
  error,
  series,
  displayCount,
  onlyAvailable,
  selectedSeries,
  onSelectSeries,
  locale,
  t,
  reload,
}: {
  query: string;
  loading: boolean;
  error: string | null;
  series: ReturnType<typeof useProductPricing>["series"];
  displayCount: number;
  onlyAvailable: boolean;
  selectedSeries: ProductSeries | null;
  onSelectSeries: (series: ProductSeries) => void;
  locale: TranslationHook["locale"];
  t: TranslationHook["t"];
  reload: () => void;
}) => {
  if (query.length < 2) {
    return <EmptyState message={t("searchStartTyping")} />;
  }

  if (loading) {
    return <LoadingState message={t("loading")} />;
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
    return (
      <EmptyState message={t("searchNoResults", { term: query })} />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          {t("searchResultsTitle")}
        </h2>
        <p className="text-sm text-slate-400">
          {displayCount} / {MAX_SEARCH_SERIES}
        </p>
        {onlyAvailable ? (
          <p className="mt-1 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {t("availabilityFilterOn")}
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
          />
        ))}
      </div>
    </section>
  );
};

const FiltersPanel = ({
  onlyAvailable,
  onToggleAvailable,
  t,
}: {
  onlyAvailable: boolean;
  onToggleAvailable: () => void;
  t: TranslationHook["t"];
}) => (
  <aside className="rounded-3xl border border-slate-800 bg-surface/60 p-6 shadow-lg shadow-black/30">
    <h2 className="text-xl font-semibold text-white">{t("filtersTitle")}</h2>
    <div className="mt-6 space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {t("filtersAvailability")}
      </p>
      <button
        type="button"
        onClick={onToggleAvailable}
        className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
          onlyAvailable
            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
            : "border-slate-700 text-slate-300 hover:border-primary hover:text-white"
        }`}
      >
        {onlyAvailable ? t("availabilityFilterOn") : t("availabilityFilterOff")}
      </button>
    </div>
  </aside>
);

const SelectedProductPanel = ({
  selected,
  locale,
  t,
}: {
  selected: ProductSeries | null;
  locale: TranslationHook["locale"];
  t: TranslationHook["t"];
}) => (
  <section className="rounded-3xl border border-slate-800 bg-surface/60 p-6 shadow-lg shadow-black/30">
    <h2 className="text-2xl font-semibold text-white mb-4">
      {t("selectedProductTitle")}
    </h2>
    {selected ? (
      <ProductCard series={selected} locale={locale} t={t} />
    ) : (
      <p className="text-slate-400">{t("selectedProductEmpty")}</p>
    )}
  </section>
);

const RecentDiscountsSection = ({
  locale,
  t,
  discounts,
  loading,
  error,
  reload,
}: {
  locale: TranslationHook["locale"];
  t: TranslationHook["t"];
  discounts: ReturnType<typeof useRecentDiscounts>["items"];
  loading: boolean;
  error: string | null;
  reload: () => void;
}) => {
  if (loading) {
    return <LoadingState message={t("loading")} />;
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

  if (discounts.length === 0) {
    return <EmptyState message={t("recentDiscountsEmpty")} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          {t("recentDiscountsTitle")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("recentDiscountsSubtitle")}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {discounts.map((item) => (
          <DiscountCard
            key={`${item.productCode}-${item.changedAt}`}
            discount={item}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </section>
  );
};

const App = () => {
  const { t, locale } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<ProductSeries | null>(
    null
  );
  const debouncedQuery = useDebouncedValue(searchValue, 400).trim();

  const searchLoader = useCallback(() => {
    if (debouncedQuery.length < 2) {
      return Promise.resolve([]);
    }
    return searchSnapshotsByName(debouncedQuery, undefined, onlyAvailable);
  }, [debouncedQuery, onlyAvailable]);

  const {
    series: searchSeries,
    loading: searchLoading,
    error: searchError,
    reload: reloadSearch,
  } = useProductPricing(searchLoader);

  const {
    items: discounts,
    loading: discountsLoading,
    error: discountsError,
    reload: reloadDiscounts,
  } = useRecentDiscounts();

  const visibleSeries = useMemo(
    () => searchSeries.slice(0, MAX_SEARCH_SERIES),
    [searchSeries]
  );
  const displayCount = visibleSeries.length;

  useEffect(() => {
    if (visibleSeries.length === 0) {
      setSelectedSeries(null);
      return;
    }
    setSelectedSeries((current) => {
      if (current && visibleSeries.some((s) => s.productCode === current.productCode)) {
        return current;
      }
      return visibleSeries[0];
    });
  }, [visibleSeries]);

  return (
    <div className="min-h-screen bg-background text-white">
      <Header
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        t={t}
      />
      <main className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <FiltersPanel
              onlyAvailable={onlyAvailable}
              onToggleAvailable={() => setOnlyAvailable((prev) => !prev)}
              t={t}
            />
            <div className="flex flex-col gap-8">
              <SearchResultsSection
                query={debouncedQuery}
                loading={searchLoading}
                error={searchError}
                series={visibleSeries}
              displayCount={displayCount}
              onlyAvailable={onlyAvailable}
              selectedSeries={selectedSeries}
              onSelectSeries={setSelectedSeries}
              locale={locale}
              t={t}
              reload={reloadSearch}
            />
            <SelectedProductPanel selected={selectedSeries} locale={locale} t={t} />
              <RecentDiscountsSection
                locale={locale}
                t={t}
                discounts={discounts}
                loading={discountsLoading}
                error={discountsError}
                reload={reloadDiscounts}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
