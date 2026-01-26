import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LocaleKey } from "../i18n/translations";
import { formatDateLabel } from "../utils/date";
import { formatPrice } from "../utils/numberFormat";
import type { ProductSeries } from "../types/product";
import { getSellerDisplayName } from "../utils/sellers";

interface ProductChartProps {
  series: ProductSeries;
  locale: LocaleKey;
  priceLabel: string;
  dateLabel: string;
}

interface TooltipPayload {
  value: number;
  dataKey: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  locale: LocaleKey;
  sellerLabels: Record<string, string>;
  currencyBySeller: Record<string, string | null>;
  priceLabel: string;
  dateLabel: string;
}

const ChartTooltip = ({
  active,
  payload,
  label,
  locale,
  sellerLabels,
  currencyBySeller,
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
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
        {priceLabel}
      </p>
      <ul className="mt-2 space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? "#fff" }}
              />
              {sellerLabels[entry.dataKey] ?? entry.dataKey}
            </span>
            <span className="font-semibold text-accent">
              {formatPrice(
                entry.value,
                currencyBySeller[entry.dataKey] ?? undefined,
                locale
              ) ?? "--"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SELLER_COLORS = ["#4f9dff", "#f472b6", "#34d399", "#f97316"];

const buildSellerConfigs = (series: ProductSeries) =>
  series.sellers.map((seller, index) => {
    const id = seller.seller || `seller-${index}`;
    return {
      id,
      label: getSellerDisplayName(id),
      color: SELLER_COLORS[index % SELLER_COLORS.length],
      currency: seller.currency ?? series.currency ?? null,
      priceMap: new Map(seller.points.map((point) => [point.rawDate, point.price])),
    };
  });

const buildChartData = (series: ProductSeries, locale: LocaleKey) => {
  const sellerConfigs = buildSellerConfigs(series);
  const dateSet = new Set<string>();
  sellerConfigs.forEach((config) => {
    config.priceMap.forEach((_, date) => dateSet.add(date));
  });
  const sortedDates = Array.from(dateSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const data = sortedDates.map((rawDate) => {
    const entry: Record<string, string | number> = {
      date: formatDateLabel(rawDate, locale),
    };
    sellerConfigs.forEach((config) => {
      const value = config.priceMap.get(rawDate);
      if (typeof value === "number") {
        entry[config.id] = value;
      }
    });
    return entry;
  });

  const sellerLabels: Record<string, string> = {};
  const currencyBySeller: Record<string, string | null> = {};
  sellerConfigs.forEach((config) => {
    sellerLabels[config.id] = config.label;
    currencyBySeller[config.id] = config.currency;
  });

  return { data, sellerConfigs, sellerLabels, currencyBySeller };
};

export const ProductChart = ({
  series,
  locale,
  priceLabel,
  dateLabel,
}: ProductChartProps) => {
  const { data, sellerConfigs, sellerLabels, currencyBySeller } = useMemo(
    () => buildChartData(series, locale),
    [series, locale]
  );

  if (data.length === 0 || sellerConfigs.length === 0) {
    return null;
  }

  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
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
                sellerLabels={sellerLabels}
                currencyBySeller={currencyBySeller}
                priceLabel={priceLabel}
                dateLabel={dateLabel}
              />
            }
          />
          <Legend formatter={(value) => sellerLabels[value] ?? value} />
          {sellerConfigs.map((config) => (
            <Line
              key={config.id}
              type="monotone"
              dataKey={config.id}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
