import type { LocaleKey } from "../../i18n/translations";
import type { ProductSeries } from "../../types/product";
import { formatDateLabel } from "../../utils/date";
import { getSellerDisplayName } from "../../utils/sellers";
import type {
  PriceChartDatum,
  PriceChartLegendItem,
  PriceChartModel,
  PriceChartRange,
  SellerChartConfig,
} from "./types";

const SELLER_COLORS = ["#079455", "#f97316", "#0b6b5b", "#2563eb", "#9333ea", "#c026d3", "#64748b"];

const RANGE_DAYS: Record<Exclude<PriceChartRange, "MAX">, number> = {
  "1M": 31,
  "3M": 92,
  "6M": 183,
  "1R": 366,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MINIMUM_AXIS_PADDING = 25;
const AXIS_PADDING_RATIO = 0.08;
const ROUNDING_STEP = 10;

const getLatestPointPrice = (priceMap: Map<string, number>): number | null => {
  const latestEntry = Array.from(priceMap.entries()).sort(
    ([leftDate], [rightDate]) => new Date(leftDate).getTime() - new Date(rightDate).getTime()
  ).at(-1);

  return latestEntry?.[1] ?? null;
};

const buildSellerConfigs = (series: ProductSeries): SellerChartConfig[] =>
  series.sellers.map((seller, index) => {
    const id = seller.seller || `seller-${index}`;
    const priceMap = new Map(seller.points.map((point) => [point.rawDate, point.price]));

    return {
      id,
      label: getSellerDisplayName(id),
      color: SELLER_COLORS[index % SELLER_COLORS.length],
      currency: seller.currency ?? series.currency ?? null,
      latestPrice: seller.latestPrice ?? getLatestPointPrice(priceMap),
      priceMap,
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

const getVisibleDates = (sellerConfigs: SellerChartConfig[], range: PriceChartRange): string[] => {
  const dateSet = new Set<string>();
  sellerConfigs.forEach((config) => {
    config.priceMap.forEach((_, date) => dateSet.add(date));
  });

  const sortedDates = Array.from(dateSet).sort(
    (leftDate, rightDate) => new Date(leftDate).getTime() - new Date(rightDate).getTime()
  );

  return filterDatesByRange(sortedDates, range);
};

const buildData = (
  sellerConfigs: SellerChartConfig[],
  locale: LocaleKey,
  range: PriceChartRange
): PriceChartDatum[] => {
  const visibleDates = getVisibleDates(sellerConfigs, range);

  return visibleDates.map((rawDate) => {
    const entry: PriceChartDatum = {
      date: formatDateLabel(rawDate, locale),
      rawDate,
    };

    sellerConfigs.forEach((config) => {
      const value = config.priceMap.get(rawDate);
      if (typeof value === "number") {
        entry[config.id] = value;
      }
    });

    return entry;
  });
};

const markLatestVisiblePoints = (data: PriceChartDatum[], sellerConfigs: SellerChartConfig[]): void => {
  sellerConfigs.forEach((config) => {
    const latestDatum = [...data].reverse().find((entry) => typeof entry[config.id] === "number");
    if (latestDatum) {
      latestDatum[`${config.id}IsLatest`] = true;
    }
  });
};

const collectVisiblePrices = (data: PriceChartDatum[], sellerConfigs: SellerChartConfig[]): number[] =>
  data.flatMap((entry) =>
    sellerConfigs
      .map((config) => entry[config.id])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  );

const roundDown = (value: number): number => Math.floor(value / ROUNDING_STEP) * ROUNDING_STEP;

const roundUp = (value: number): number => Math.ceil(value / ROUNDING_STEP) * ROUNDING_STEP;

const buildYDomain = (prices: number[]): [number, number] => {
  if (prices.length === 0) {
    return [0, ROUNDING_STEP];
  }

  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const spread = Math.max(maximum - minimum, MINIMUM_AXIS_PADDING);
  const padding = Math.max(spread * AXIS_PADDING_RATIO, MINIMUM_AXIS_PADDING);
  const lower = Math.max(0, roundDown(minimum - padding));
  const upper = Math.max(lower + ROUNDING_STEP, roundUp(maximum + padding));

  return [lower, upper];
};

const buildLegendItems = (
  sellerConfigs: SellerChartConfig[],
  activeSellerIds: Set<string>
): PriceChartLegendItem[] => {
  const currentPrices = sellerConfigs
    .map((config) => config.latestPrice)
    .filter((price): price is number => typeof price === "number" && Number.isFinite(price));
  const bestPrice = currentPrices.length > 0 ? Math.min(...currentPrices) : null;

  return sellerConfigs
    .map((config) => ({
      id: config.id,
      label: config.label,
      color: config.color,
      currency: config.currency,
      latestPrice: config.latestPrice,
      differenceFromBest:
        bestPrice !== null && config.latestPrice !== null ? Math.max(0, config.latestPrice - bestPrice) : null,
      isActive: activeSellerIds.has(config.id),
      isBest: bestPrice !== null && config.latestPrice === bestPrice,
    }))
    .sort((left, right) => {
      const leftPrice = left.latestPrice ?? Number.POSITIVE_INFINITY;
      const rightPrice = right.latestPrice ?? Number.POSITIVE_INFINITY;
      return leftPrice - rightPrice || left.label.localeCompare(right.label);
    });
};

export const buildPriceChartModel = (
  series: ProductSeries,
  locale: LocaleKey,
  range: PriceChartRange,
  activeSellerIds: Set<string>
): PriceChartModel => {
  const allSellerConfigs = buildSellerConfigs(series);
  const activeSellerConfigs = allSellerConfigs.filter((config) => activeSellerIds.has(config.id));
  const data = buildData(activeSellerConfigs, locale, range);
  markLatestVisiblePoints(data, activeSellerConfigs);
  const sellerLabels: Record<string, string> = {};
  const currencyBySeller: Record<string, string | null> = {};

  allSellerConfigs.forEach((config) => {
    sellerLabels[config.id] = config.label;
    currencyBySeller[config.id] = config.currency;
  });

  return {
    data,
    activeSellerConfigs,
    allSellerConfigs,
    legendItems: buildLegendItems(allSellerConfigs, activeSellerIds),
    sellerLabels,
    currencyBySeller,
    yDomain: buildYDomain(collectVisiblePrices(data, activeSellerConfigs)),
  };
};
