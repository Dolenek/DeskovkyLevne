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
    return { label: "--", tone: "text-muted" };
  }

  const delta = series.latestPrice - series.firstPrice;
  const formatted = formatPrice(delta, series.currency ?? undefined, locale);
  if (delta > 0) {
    return { label: `+${formatted}`, tone: "text-accent" };
  }
  if (delta < 0) {
    return { label: formatted, tone: "text-secondary" };
  }

  return { label: formatted, tone: "text-muted" };
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
        <p className="text-sm uppercase tracking-wide text-muted">
          {t("productCodeLabel")}
        </p>
        <h2 className="font-display text-2xl font-semibold text-ink">
          {series.label}
        </h2>
        <p className="text-sm text-muted">
          {series.primaryProductCode ?? series.slug}
        </p>
        {series.availabilityLabel ? (
          <span className="mt-2 inline-flex rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
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
        className="rounded-full border border-outline px-4 py-2 text-sm text-ink transition hover:border-primary hover:text-primary"
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
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-outline bg-surface-muted p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {t("latestPrice")}
        </p>
        <p className="text-2xl font-semibold text-ink">
          {formatPrice(series.latestPrice, series.currency ?? undefined, locale)}
        </p>
        {series.listPrice !== null ? (
          <p className="text-xs text-muted">
            {t("listPriceLabel")}:{" "}
            <span className="text-ink">
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
        <p className="text-xs uppercase tracking-wide text-muted">
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
    <p className="text-xs text-muted">
      {t("lastUpdated", { value: lastDate })}
    </p>
  );
};

export const ProductCard = ({ series, locale, t }: ProductCardProps) => (
  <article className="flex flex-col gap-6 rounded-3xl border border-outline bg-surface/90 p-6 shadow-card backdrop-blur">
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
      <p className="rounded-2xl border border-dashed border-outline p-6 text-center text-muted">
        {t("noSeriesData")}
      </p>
    )}
    <ProductFooter series={series} locale={locale} t={t} />
  </article>
);
