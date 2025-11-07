import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LocaleKey } from "../i18n/translations";
import { formatDateLabel } from "../utils/date";
import { formatPrice } from "../utils/numberFormat";
import type { ProductSeries } from "../types/product";

interface ProductChartProps {
  series: ProductSeries;
  locale: LocaleKey;
  priceLabel: string;
  dateLabel: string;
}

interface TooltipPayload {
  value: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  locale: LocaleKey;
  currency?: string | null;
  priceLabel: string;
  dateLabel: string;
}

const ChartTooltip = ({
  active,
  payload,
  label,
  locale,
  currency,
  priceLabel,
  dateLabel,
}: ChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg shadow-black/50">
      <p className="text-slate-300">
        {dateLabel}: <span className="font-semibold text-white">{label}</span>
      </p>
      <p className="text-slate-300">
        {priceLabel}:{" "}
        <span className="font-semibold text-accent">
          {formatPrice(payload[0].value, currency ?? undefined, locale)}
        </span>
      </p>
    </div>
  );
};

export const ProductChart = ({
  series,
  locale,
  priceLabel,
  dateLabel,
}: ProductChartProps) => {
  const gradientId = useMemo(
    () => `priceGradient-${series.productCode.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [series.productCode]
  );

  const chartData = useMemo(
    () =>
      series.points.map((point) => ({
        price: point.price,
        date: formatDateLabel(point.rawDate, locale),
      })),
    [series.points, locale]
  );

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f9dff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4f9dff" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            width={80}
            tickFormatter={(value) =>
              formatPrice(Number(value), series.currency ?? undefined, locale)
            }
          />
          <Tooltip
            content={
              <ChartTooltip
                locale={locale}
                currency={series.currency}
                priceLabel={priceLabel}
                dateLabel={dateLabel}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#4f9dff"
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
