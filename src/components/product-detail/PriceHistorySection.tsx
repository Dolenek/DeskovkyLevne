import { useMemo, useState } from "react";
import { ProductChart, type PriceChartRange } from "../ProductChart";
import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import type { LocaleKey } from "../../i18n/translations";
import { buildPriceChartModel } from "../product-chart/chartData";
import { PriceChartLegend } from "../product-chart/PriceChartLegend";

interface PriceHistorySectionProps {
  series: ProductSeries;
  locale: LocaleKey;
  priceLabel: string;
  dateLabel: string;
  t: Translator;
}

const RANGE_OPTIONS: PriceChartRange[] = ["1M", "3M", "6M", "1R", "MAX"];

const getSellerIds = (series: ProductSeries): string[] =>
  series.sellers.map((seller, index) => seller.seller || `seller-${index}`);

export const PriceHistorySection = ({
  series,
  locale,
  priceLabel,
  dateLabel,
  t,
}: PriceHistorySectionProps) => {
  const [selectedRange, setSelectedRange] = useState<PriceChartRange>("3M");
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
  const allSellerIds = useMemo(() => getSellerIds(series), [series]);
  const activeSellerIds = useMemo(() => {
    const existingSelectedIds = selectedSellerIds.filter((id) => allSellerIds.includes(id));
    return new Set(existingSelectedIds.length > 0 ? existingSelectedIds : allSellerIds);
  }, [allSellerIds, selectedSellerIds]);
  const chartModel = useMemo(
    () => buildPriceChartModel(series, locale, selectedRange, activeSellerIds),
    [activeSellerIds, locale, selectedRange, series]
  );

  const toggleSeller = (sellerId: string) => {
    setSelectedSellerIds((currentIds) => {
      const existingIds = currentIds.filter((id) => allSellerIds.includes(id));
      const visibleIds = existingIds.length > 0 ? existingIds : allSellerIds;

      if (!visibleIds.includes(sellerId)) {
        return [...visibleIds, sellerId];
      }

      return visibleIds.length > 1 ? visibleIds.filter((id) => id !== sellerId) : visibleIds;
    });
  };

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-extrabold text-navy">{t("detailHistoryTitle")}</h2>
        <div
          className="inline-flex w-fit flex-wrap gap-1 rounded-lg border border-line bg-background p-1 text-xs font-bold text-muted"
          aria-label={t("detailHistoryRangeLabel")}
        >
          {RANGE_OPTIONS.map((range) => {
            const active = range === selectedRange;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setSelectedRange(range)}
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 transition ${
                  active ? "bg-white text-primary shadow-sm" : "hover:bg-white hover:text-navy"
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>
      {chartModel.legendItems.length > 0 ? (
        <div className="mb-4">
          <PriceChartLegend items={chartModel.legendItems} locale={locale} onToggleSeller={toggleSeller} />
        </div>
      ) : null}
      <ProductChart
        series={series}
        locale={locale}
        priceLabel={priceLabel}
        dateLabel={dateLabel}
        model={chartModel}
      />
    </section>
  );
};
