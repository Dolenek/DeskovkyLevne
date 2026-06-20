import { useMemo } from "react";
import {
  CartesianGrid,
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

export type PriceChartRange = "1M" | "3M" | "6M" | "1R" | "MAX";

interface ProductChartProps {
  series: ProductSeries;
  locale: LocaleKey;
  priceLabel: string;
  dateLabel: string;
  range: PriceChartRange;
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

const SELLER_COLORS = ["#079455", "#f97316", "#0b6b5b", "#2563eb", "#9333ea", "#c026d3"];
const RANGE_DAYS: Record<Exclude<PriceChartRange, "MAX">, number> = {
  "1M": 31,
  "3M": 92,
  "6M": 183,
  "1R": 366,
};
const DAY_MS = 24 * 60 * 60 * 1000;

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
              {formatPrice(entry.value, currencyBySeller[entry.dataKey] ?? undefined, locale) ?? "--"}
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

const filterDatesByRange = (dates: string[], range: PriceChartRange): string[] => {
  if (range === "MAX" || dates.length === 0) {
    return dates;
  }
  const latestTimestamp = Math.max(...dates.map((date) => new Date(date).getTime()));
  if (!Number.isFinite(latestTimestamp)) {
    return dates;
  }
  const minimumTimestamp = latestTimestamp - RANGE_DAYS[range] * DAY_MS;
  const filteredDates = dates.filter((date) => {
    const timestamp = new Date(date).getTime();
    return Number.isFinite(timestamp) && timestamp >= minimumTimestamp;
  });
  return filteredDates.length > 0 ? filteredDates : dates.slice(-1);
};

const buildChartData = (series: ProductSeries, locale: LocaleKey, range: PriceChartRange) => {
  const sellerConfigs = buildSellerConfigs(series);
  const dateSet = new Set<string>();
  sellerConfigs.forEach((config) => {
    config.priceMap.forEach((_, date) => dateSet.add(date));
  });
  const sortedDates = Array.from(dateSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const visibleDates = filterDatesByRange(sortedDates, range);

  const data = visibleDates.map((rawDate) => {
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
  range,
}: ProductChartProps) => {
  const { data, sellerConfigs, sellerLabels, currencyBySeller } = useMemo(
    () => buildChartData(series, locale, range),
    [series, locale, range]
  );

  if (data.length === 0 || sellerConfigs.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        {sellerConfigs.map((config) => (
          <span key={config.id} className="inline-flex items-center gap-2 text-xs font-bold text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
            {config.label}
          </span>
        ))}
      </div>
      <div className="custom-scrollbar overflow-x-auto">
        <div className="h-[260px] min-w-[640px] md:min-w-0">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 8, right: 18, bottom: 4, left: 0 }}>
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
      </div>
    </div>
  );
};
