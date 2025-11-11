import { useCallback, useEffect, useMemo, useState } from "react";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useProductPricing } from "../hooks/useProductPricing";
import { useTranslation, type TranslationHook } from "../hooks/useTranslation";
import { searchSnapshotsByName } from "../services/productService";
import type { ProductSeries } from "../types/product";
import { FiltersPanel } from "./search/FiltersPanel";
import { SearchResultsSection } from "./search/SearchResultsSection";
import { FilteredProductsSection } from "./search/FilteredProductsSection";

interface SearchPageProps {
  onProductNavigate: (productCode: string) => void;
}

const MAX_SEARCH_SERIES = Number(
  import.meta.env.VITE_SEARCH_MAX_SERIES ?? "6"
);

const parsePriceInput = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

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

const SearchPage = ({ onProductNavigate }: SearchPageProps) => {
  const { t, locale } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<ProductSeries | null>(
    null
  );
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [pricePage, setPricePage] = useState(1);
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
    series: allSeries,
    loading: filteredLoading,
    error: filteredError,
    reload: reloadFiltered,
  } = useProductPricing();

  const priceRange = useMemo(
    () => ({
      min: parsePriceInput(priceFilter.min),
      max: parsePriceInput(priceFilter.max),
    }),
    [priceFilter]
  );

  const priceBounds = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    allSeries.forEach((series) => {
      series.points.forEach((point) => {
        if (point.price < min) {
          min = point.price;
        }
        if (point.price > max) {
          max = point.price;
        }
      });
      if (series.points.length === 0) {
        [series.firstPrice, series.latestPrice].forEach((price) => {
          if (price === null || Number.isNaN(price)) {
            return;
          }
          if (price < min) {
            min = price;
          }
          if (price > max) {
            max = price;
          }
        });
      }
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: 0, max: 1000 };
    }
    if (min === max) {
      return { min: Math.floor(min), max: Math.ceil(min + 100) };
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [allSeries]);

  const handlePriceFilterChange = useCallback(
    (key: "min" | "max", value: string) => {
      setPriceFilter((current) => ({ ...current, [key]: value }));
      setPricePage(1);
    },
    []
  );

  const handleSliderChange = useCallback(
    (key: "min" | "max", numericValue: number) => {
      const rounded = Math.max(0, Math.round(numericValue));
      setPriceFilter((current) => ({
        ...current,
        [key]: rounded.toString(),
      }));
      setPricePage(1);
    },
    []
  );

  useEffect(() => {
    setPricePage(1);
  }, [onlyAvailable]);

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
              priceFilter={priceFilter}
              priceRangeValues={priceRange}
              priceBounds={priceBounds}
              onPriceFilterChange={handlePriceFilterChange}
              onSliderChange={handleSliderChange}
              t={t}
            />
            <div className="flex flex-col gap-8">
              <SearchResultsSection
                query={debouncedQuery}
                loading={searchLoading}
                error={searchError}
                series={visibleSeries}
                displayCount={displayCount}
                maxCount={MAX_SEARCH_SERIES}
                onlyAvailable={onlyAvailable}
                selectedSeries={selectedSeries}
                onSelectSeries={setSelectedSeries}
                onNavigateToSeries={(series) =>
                  onProductNavigate(series.productCode)
                }
                locale={locale}
                t={t}
                reload={reloadSearch}
              />
              <FilteredProductsSection
                series={allSeries}
                loading={filteredLoading}
                error={filteredError}
                reload={reloadFiltered}
                locale={locale}
                t={t}
                priceRange={priceRange}
                onlyAvailable={onlyAvailable}
                page={pricePage}
                onPageChange={setPricePage}
                onNavigateToSeries={(series) =>
                  onProductNavigate(series.productCode)
                }
                selectedSeries={selectedSeries}
                onSelectSeries={setSelectedSeries}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
