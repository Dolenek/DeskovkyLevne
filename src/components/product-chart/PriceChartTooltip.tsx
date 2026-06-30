import type { LocaleKey } from "../../i18n/translations";
import { formatPrice } from "../../utils/numberFormat";
import { chartCopy } from "./chartCopy";

interface TooltipPayload {
  value?: number;
  dataKey?: string | number;
  color?: string;
}

interface PriceChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  locale: LocaleKey;
  sellerLabels: Record<string, string>;
  currencyBySeller: Record<string, string | null>;
  priceLabel: string;
  dateLabel: string;
}

interface TooltipRow {
  sellerId: string;
  label: string;
  value: number;
  color: string;
  currency: string | null;
}

const buildRows = (
  payload: TooltipPayload[],
  sellerLabels: Record<string, string>,
  currencyBySeller: Record<string, string | null>
): TooltipRow[] =>
  payload
    .filter((entry): entry is TooltipPayload & { dataKey: string | number; value: number } =>
      typeof entry.value === "number" && Number.isFinite(entry.value) && entry.dataKey !== undefined
    )
    .map((entry) => {
      const sellerId = String(entry.dataKey);
      return {
        sellerId,
        label: sellerLabels[sellerId] ?? sellerId,
        value: entry.value,
        color: entry.color ?? "#079455",
        currency: currencyBySeller[sellerId] ?? null,
      };
    })
    .sort((left, right) => left.value - right.value || left.label.localeCompare(right.label));

export const PriceChartTooltip = ({
  active,
  payload,
  label,
  locale,
  sellerLabels,
  currencyBySeller,
  priceLabel,
  dateLabel,
}: PriceChartTooltipProps) => {
  const rows = buildRows(payload ?? [], sellerLabels, currencyBySeller);
  if (!active || rows.length === 0) {
    return null;
  }

  const bestPrice = rows[0]?.value ?? null;

  return (
    <div className="max-w-[320px] rounded-lg border border-line bg-white px-4 py-3 text-sm text-navy shadow-xl">
      <p className="text-muted">
        {dateLabel}: <span className="font-bold text-navy">{label}</span>
      </p>
      <p className="mt-2 text-xs font-extrabold uppercase text-muted">{priceLabel}</p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => {
          const difference = bestPrice !== null ? row.value - bestPrice : 0;

          return (
            <li key={row.sellerId} className="flex items-center justify-between gap-6">
              <span className="flex min-w-0 items-center gap-2 text-muted">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-extrabold text-primary">
                  {formatPrice(row.value, row.currency ?? undefined, locale)}
                </span>
                {difference > 0 ? (
                  <span className="block text-xs font-bold text-muted">
                    {chartCopy(locale, "detailChartDifference", {
                      value: formatPrice(difference, row.currency ?? undefined, locale),
                    })}
                  </span>
                ) : (
                  <span className="block text-xs font-bold text-primary">
                    {chartCopy(locale, "detailChartCheapest")}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
