import type { RefObject } from "react";
import type { ProductSearchResult } from "../../types/product";
import { formatAvailabilityLabel } from "../../utils/availability";
import { formatPrice } from "../../utils/numberFormat";
import { SkeletonImage } from "../skeleton";

interface SearchOverlayResultsListProps {
  results: ProductSearchResult[];
  activeIndex: number;
  locale: Parameters<typeof formatPrice>[2];
  listRef: RefObject<HTMLUListElement | null>;
  onActivateIndex: (index: number) => void;
  onSelect: (series: ProductSearchResult) => void;
}

const getSeriesImage = (series: ProductSearchResult): string | null =>
  series.heroImage ?? series.galleryImages?.[0] ?? null;

const fallbackInitial = (series: ProductSearchResult) =>
  series.label?.charAt(0).toUpperCase() || series.slug.charAt(0).toUpperCase();

const resultButtonClass = (active: boolean) =>
  [
    "flex w-full flex-col gap-2 rounded-lg border px-4 py-2 text-left shadow-sm transition",
    "sm:flex-row sm:items-center sm:justify-between",
    active
      ? "border-primary bg-emerald-50 shadow-md ring-2 ring-primary/20"
      : "border-line bg-white hover:border-primary hover:shadow-md",
  ].join(" ");

const SearchResultImage = ({ series }: { series: ProductSearchResult }) => {
  const image = getSeriesImage(series);
  if (!image) {
    return (
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center text-lg font-semibold text-muted">
        {fallbackInitial(series)}
      </div>
    );
  }
  return (
    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden">
      <SkeletonImage src={image} alt={series.label} className="h-full w-full object-contain" />
    </div>
  );
};

const SearchResultLabel = ({ series }: { series: ProductSearchResult }) => (
  <div>
    <p className="text-base font-extrabold text-navy">{series.label}</p>
    <p className="text-sm text-muted">{series.primaryProductCode ?? series.slug}</p>
  </div>
);

const SearchResultMeta = ({
  series,
  locale,
}: {
  series: ProductSearchResult;
  locale: Parameters<typeof formatPrice>[2];
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {series.availabilityLabel ? (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-primary">
        {formatAvailabilityLabel(series.availabilityLabel, locale)}
      </span>
    ) : null}
    <span className="text-lg font-extrabold text-primary">
      {formatPrice(series.latestPrice, series.currency ?? undefined, locale) ?? "--"}
    </span>
  </div>
);

const SearchResultRow = ({
  series,
  active,
  locale,
  onActivate,
  onSelect,
}: {
  series: ProductSearchResult;
  active: boolean;
  locale: Parameters<typeof formatPrice>[2];
  onActivate: () => void;
  onSelect: () => void;
}) => (
  <li data-search-result-row="true">
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onActivate}
      className={resultButtonClass(active)}
      aria-current={active ? "true" : undefined}
      data-active-result={active ? "true" : undefined}
    >
      <div className="flex items-center gap-4">
        <SearchResultImage series={series} />
        <SearchResultLabel series={series} />
      </div>
      <SearchResultMeta series={series} locale={locale} />
    </button>
  </li>
);

export const SearchOverlayResultsList = ({
  results,
  activeIndex,
  locale,
  listRef,
  onActivateIndex,
  onSelect,
}: SearchOverlayResultsListProps) => (
  <ul ref={listRef} className="space-y-2">
    {results.map((series, index) => (
      <SearchResultRow
        key={series.slug}
        series={series}
        active={index === activeIndex}
        locale={locale}
        onActivate={() => onActivateIndex(index)}
        onSelect={() => onSelect(series)}
      />
    ))}
  </ul>
);
