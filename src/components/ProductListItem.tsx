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
      className={`flex w-full flex-col gap-3 rounded-3xl border px-4 py-3 text-left transition no-underline shadow-float sm:flex-row sm:items-center ${
        selected
          ? "border-primary bg-white/70"
          : "border-outline bg-surface/80 hover:border-primary/70"
      }`}
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-outline bg-surface-muted sm:h-20 sm:w-20">
        {series.heroImage ? (
          <img
            src={series.heroImage}
            alt={series.label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted">
            {series.label.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-display text-lg font-semibold text-ink">
          {series.label}
        </p>
        {series.availabilityLabel ? (
          <span className="inline-flex w-fit rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
            {series.availabilityLabel}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-3 text-left sm:flex-col sm:items-end sm:text-right">
        <p className="text-2xl font-semibold text-ink">{latestPrice}</p>
        {previousPrice ? (
          <p className="text-sm text-muted line-through">{previousPrice}</p>
        ) : null}
      </div>
    </a>
  );
};
