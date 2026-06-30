import type { LocaleKey } from "../../i18n/translations";
import type { ProductSeries } from "../../types/product";

export type PriceChartRange = "1M" | "3M" | "6M" | "1R" | "MAX";

export interface SellerChartConfig {
  id: string;
  label: string;
  color: string;
  currency: string | null;
  latestPrice: number | null;
  priceMap: Map<string, number>;
}

export interface PriceChartDatum {
  date: string;
  rawDate: string;
  [key: string]: string | number | boolean | undefined;
}

export interface PriceChartLegendItem {
  id: string;
  label: string;
  color: string;
  currency: string | null;
  latestPrice: number | null;
  differenceFromBest: number | null;
  isActive: boolean;
  isBest: boolean;
}

export interface PriceChartModel {
  data: PriceChartDatum[];
  activeSellerConfigs: SellerChartConfig[];
  allSellerConfigs: SellerChartConfig[];
  legendItems: PriceChartLegendItem[];
  sellerLabels: Record<string, string>;
  currencyBySeller: Record<string, string | null>;
  yDomain: [number, number];
}

export interface ProductChartProps {
  series: ProductSeries;
  locale: LocaleKey;
  priceLabel: string;
  dateLabel: string;
  model: PriceChartModel;
}
