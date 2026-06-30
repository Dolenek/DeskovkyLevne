import { useState } from "react";
import { ProductChart, type PriceChartRange } from "../ProductChart";
import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import type { LocaleKey } from "../../i18n/translations";

interface PriceHistorySectionProps {
  series: ProductSeries;
  locale: LocaleKey;
  priceLabel: string;
  dateLabel: string;
  t: Translator;
}

const RANGE_OPTIONS: PriceChartRange[] = ["1M", "3M", "6M", "1R", "MAX"];

export const PriceHistorySection = ({
  series,
  locale,
  priceLabel,
  dateLabel,
  t,
}: PriceHistorySectionProps) => {
  const [selectedRange, setSelectedRange] = useState<PriceChartRange>("3M");

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
      <ProductChart
        series={series}
        locale={locale}
        priceLabel={priceLabel}
        dateLabel={dateLabel}
        range={selectedRange}
      />
    </section>
  );
};
