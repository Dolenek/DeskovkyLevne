import type { MouseEvent } from "react";
import type { ProductSeries } from "../types/product";
import type { LocaleKey } from "../i18n/translations";
import { formatPrice } from "../utils/numberFormat";

interface ProductListItemProps {
  series: ProductSeries;
  locale: LocaleKey;
  selected: boolean;
  onSelect: (series: ProductSeries) => void;
  onNavigate: (series: ProductSeries) => void;
}

export const ProductListItem = ({
  series,
  locale,
  selected,
  onSelect,
  onNavigate,
}: ProductListItemProps) => {
  const latestPrice = formatPrice(
    series.latestPrice,
    series.currency ?? undefined,
    locale
  );
  const previousPrice =
    series.previousPrice !== null
      ? formatPrice(
          series.previousPrice,
          series.currency ?? undefined,
          locale
        )
      : null;
  const href = `/deskove-hry/${encodeURIComponent(series.slug)}`;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(series);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => onSelect(series)}
      onFocus={() => onSelect(series)}
      className={`flex w-full flex-col gap-3 rounded-3xl border px-4 py-3 text-left transition no-underline sm:flex-row sm:items-center ${
        selected
          ? "border-primary bg-surface/80 shadow-2xl shadow-black/40"
          : "border-slate-800 bg-surface/50 hover:border-primary/70"
      }`}
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-900/70 sm:h-20 sm:w-20">
        {series.heroImage ? (
          <img
            src={series.heroImage}
            alt={series.label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
            {series.label.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-lg font-semibold text-white">{series.label}</p>
        {series.availabilityLabel ? (
          <span className="inline-flex w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {series.availabilityLabel}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-3 text-left sm:flex-col sm:items-end sm:text-right">
        <p className="text-2xl font-semibold text-white">{latestPrice}</p>
        {previousPrice ? (
          <p className="text-sm text-slate-400 line-through">{previousPrice}</p>
        ) : null}
      </div>
    </a>
  );
};
