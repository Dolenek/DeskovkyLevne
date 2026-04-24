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

const SELLER_COLORS = ["#079455", "#f97316", "#0b6b5b", "#2563eb", "#9333ea"];

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
    <div className="rounded-lg border border-line bg-white px-4 py-3 text-sm text-navy shadow-xl">
      <p className="text-muted">
        {dateLabel}: <span className="font-bold text-navy">{label}</span>
      </p>
      <p className="mt-2 text-xs font-extrabold uppercase text-muted">{priceLabel}</p>
      <ul className="mt-2 space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? "#079455" }}
              />
              {sellerLabels[entry.dataKey] ?? entry.dataKey}
            </span>
            <span className="font-extrabold text-primary">
              {formatPrice(entry.value, currencyBySeller[entry.dataKey] ?? undefined, locale) ??
                "--"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

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
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 18, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="chartSoftFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#079455" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#079455" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e7edf5" vertical={false} />
          <XAxis dataKey="date" stroke="#60708c" tick={{ fill: "#60708c", fontSize: 12 }} />
          <YAxis
            stroke="#60708c"
            tick={{ fill: "#60708c", fontSize: 12 }}
            width={78}
            tickFormatter={(value) =>
              formatPrice(Number(value), series.currency ?? undefined, locale) ?? ""
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
          <Legend
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs font-bold text-muted">
                {sellerLabels[String(value)] ?? String(value)}
              </span>
            )}
          />
          {sellerConfigs.map((config) => (
            <Line
              key={config.id}
              type="monotone"
              dataKey={config.id}
              stroke={config.color}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
