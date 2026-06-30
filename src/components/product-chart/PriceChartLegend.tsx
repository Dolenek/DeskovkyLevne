import type { LocaleKey } from "../../i18n/translations";
import { formatPrice } from "../../utils/numberFormat";
import { chartCopy } from "./chartCopy";
import type { PriceChartLegendItem } from "./types";

interface PriceChartLegendProps {
  items: PriceChartLegendItem[];
  locale: LocaleKey;
  onToggleSeller: (sellerId: string) => void;
}

const formatDifference = (
  value: number | null,
  currency: string | null,
  locale: LocaleKey
): string | null => {
  if (value === null || value <= 0) {
    return null;
  }

  return chartCopy(locale, "detailChartDifference", {
    value: formatPrice(value, currency ?? undefined, locale),
  });
};

export const PriceChartLegend = ({ items, locale, onToggleSeller }: PriceChartLegendProps) => (
  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => {
      const price = formatPrice(item.latestPrice, item.currency ?? undefined, locale);
      const difference = formatDifference(item.differenceFromBest, item.currency, locale);
      const actionLabel = chartCopy(
        locale,
        item.isActive ? "detailChartHideSeller" : "detailChartShowSeller",
        { seller: item.label }
      );

      return (
        <button
          key={item.id}
          type="button"
          aria-label={actionLabel}
          aria-pressed={item.isActive}
          onClick={() => onToggleSeller(item.id)}
          className={`flex min-h-[46px] items-center justify-between gap-3 rounded-md border px-3 py-1.5 text-left transition ${
            item.isActive
              ? "border-line bg-white text-navy shadow-sm hover:border-primary/50"
              : "border-line bg-background text-muted opacity-70 hover:opacity-100"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold">{item.label}</span>
              <span className="block text-xs font-bold text-muted">
                {item.isBest ? chartCopy(locale, "detailChartCheapest") : difference ?? "\u00a0"}
              </span>
            </span>
          </span>
          <span className="shrink-0 text-right text-sm font-extrabold text-primary">{price}</span>
        </button>
      );
    })}
  </div>
);
