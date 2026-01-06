import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import { formatPrice } from "../../utils/numberFormat";
import { formatDateLabel } from "../../utils/date";

interface ProductHeroProps {
  series: ProductSeries;
  locale: Parameters<typeof formatDateLabel>[1];
  t: Translator;
}

export const ProductHero = ({ series, locale, t }: ProductHeroProps) => {
  const latestPrice = formatPrice(
    series.latestPrice,
    series.currency ?? undefined,
    locale
  );
  const lastUpdated = series.latestScrapedAt
    ? formatDateLabel(series.latestScrapedAt, locale)
    : "--";

  return (
    <section className="flex h-full max-h-screen flex-col overflow-y-auto rounded-3xl border border-outline bg-surface/90 p-6 shadow-card backdrop-blur animate-fade-up">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted">
          {t("productCodeLabel")}
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          {series.label}
        </h1>
        <p className="text-sm text-muted">
          {series.primaryProductCode ?? series.slug}
        </p>
        {series.availabilityLabel ? (
          <span className="mt-3 inline-flex rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
            {series.availabilityLabel}
          </span>
        ) : null}
        {series.shortDescription ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
            {series.shortDescription}
          </p>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-4 pt-6">
        <div className="rounded-2xl border border-outline bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("latestPrice")}
          </p>
          <p className="text-4xl font-semibold text-ink">{latestPrice}</p>
          {series.listPrice !== null ? (
            <p className="text-xs text-muted">
              {t("listPriceLabel")}: {" "}
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
        <div className="rounded-2xl border border-outline bg-surface-muted p-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("lastUpdated", { value: lastUpdated })}
          </p>
          {series.url ? (
            <a
              href={series.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-ink transition hover:bg-primary/15"
            >
              {t("detailSourceLink")}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
};
