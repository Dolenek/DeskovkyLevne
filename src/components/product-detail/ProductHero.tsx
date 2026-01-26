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
    <section className="flex h-full flex-col rounded-3xl border border-slate-800 bg-surface/70 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-6 lg:max-h-screen lg:overflow-y-auto">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">
          {t("productCodeLabel")}
        </p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          {series.label}
        </h1>
        <p className="text-sm text-slate-400">
          {series.primaryProductCode ?? series.slug}
        </p>
        {series.availabilityLabel ? (
          <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {series.availabilityLabel}
          </span>
        ) : null}
        {series.shortDescription ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {series.shortDescription}
          </p>
        ) : null}
      </div>
      <div className="mt-6 flex flex-col gap-4 pt-6 lg:mt-auto">
        <div className="rounded-2xl border border-slate-700 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t("latestPrice")}
          </p>
          <p className="text-3xl font-semibold text-accent sm:text-4xl">
            {latestPrice}
          </p>
          {series.listPrice !== null ? (
            <p className="text-xs text-slate-400">
              {t("listPriceLabel")}: {" "}
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
        <div className="rounded-2xl border border-slate-700 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t("lastUpdated", { value: lastUpdated })}
          </p>
          {series.url ? (
            <a
              href={series.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/20"
            >
              {t("detailSourceLink")}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
};
