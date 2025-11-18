import { ProductChart } from "./ProductChart";
import type { LocaleKey } from "../i18n/translations";
import { formatDateLabel } from "../utils/date";
import { formatPrice } from "../utils/numberFormat";
import type { ProductSeries } from "../types/product";
import type { TranslationHook } from "../hooks/useTranslation";

interface ProductCardProps {
  series: ProductSeries;
  locale: LocaleKey;
  t: TranslationHook["t"];
}

const buildChangeLabel = (
  series: ProductSeries,
  locale: LocaleKey
): { label: string; tone: string } => {
  if (series.latestPrice === null || series.firstPrice === null) {
    return { label: "--", tone: "text-slate-400" };
  }

  const delta = series.latestPrice - series.firstPrice;
  const formatted = formatPrice(delta, series.currency ?? undefined, locale);
  if (delta > 0) {
    return { label: `+${formatted}`, tone: "text-rose-400" };
  }
  if (delta < 0) {
    return { label: formatted, tone: "text-emerald-400" };
  }

  return { label: formatted, tone: "text-slate-300" };
};

const ProductHeader = ({
  series,
  t,
}: {
  series: ProductSeries;
  t: TranslationHook["t"];
}) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
    <div className="flex gap-4">
      {series.heroImage ? (
        <img
          src={series.heroImage}
          alt={series.label}
          className="h-20 w-20 rounded-2xl object-cover"
        />
      ) : null}
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">
          {t("productCodeLabel")}
        </p>
        <h2 className="text-2xl font-semibold text-white">{series.label}</h2>
        <p className="text-sm text-slate-400">
          {series.primaryProductCode ?? series.slug}
        </p>
        {series.availabilityLabel ? (
          <span className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {series.availabilityLabel}
          </span>
        ) : null}
      </div>
    </div>
    {series.url ? (
      <a
        href={series.url}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-primary hover:text-white"
      >
        {series.url.replace(/^https?:\/\//, "")}
      </a>
    ) : null}
  </div>
);

const ProductStats = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries;
  locale: LocaleKey;
  t: TranslationHook["t"];
}) => {
  const change = buildChangeLabel(series, locale);
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-black/20 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {t("latestPrice")}
        </p>
        <p className="text-2xl font-semibold text-accent">
          {formatPrice(series.latestPrice, series.currency ?? undefined, locale)}
        </p>
        {series.listPrice !== null ? (
          <p className="text-xs text-slate-400">
            {t("listPriceLabel")}:{" "}
            <span className="text-slate-200">
              {formatPrice(
                series.listPrice,
                series.currency ?? undefined,
                locale
              )}
            </span>
          </p>
        ) : null}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {t("priceChange")}
        </p>
        <p className={`text-2xl font-semibold ${change.tone}`}>
          {change.label}
        </p>
      </div>
    </div>
  );
};

const ProductFooter = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries;
  locale: LocaleKey;
  t: TranslationHook["t"];
}) => {
  const lastDate = series.latestScrapedAt
    ? formatDateLabel(series.latestScrapedAt, locale)
    : "--";
  return (
    <p className="text-xs text-slate-400">
      {t("lastUpdated", { value: lastDate })}
    </p>
  );
};

export const ProductCard = ({ series, locale, t }: ProductCardProps) => (
  <article className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-surface/70 p-6 shadow-2xl shadow-black/40 backdrop-blur">
    <ProductHeader series={series} t={t} />
    <ProductStats series={series} locale={locale} t={t} />
    {series.points.length > 0 ? (
      <ProductChart
        series={series}
        locale={locale}
        priceLabel={t("price")}
        dateLabel={t("date")}
      />
    ) : (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
        {t("noSeriesData")}
      </p>
    )}
    <ProductFooter series={series} locale={locale} t={t} />
  </article>
);
