import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import { formatPrice } from "../../utils/numberFormat";
import { getSeriesDiscountPercent } from "../../utils/priceStats";
import { Icon } from "../ui/Icon";

interface ProductHeroProps {
  series: ProductSeries;
  locale: Parameters<typeof formatPrice>[2];
  offersSectionId: string;
  t: Translator;
}

export const ProductHero = ({ series, locale, offersSectionId, t }: ProductHeroProps) => {
  const discount = getSeriesDiscountPercent(series);

  return (
    <section className="flex h-full min-w-0 flex-col">
      <p className="text-sm font-bold text-muted">{t("detailBreadcrumb", { value: series.label })}</p>
      <h1 className="mt-5 break-words text-4xl font-black leading-tight text-navy [overflow-wrap:anywhere]">
        {series.label}
      </h1>
      <p className="mt-2 text-lg font-semibold text-muted">
        {series.categoryTags.slice(0, 2).join(" • ") || t("detailFallbackCategory")}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-muted">
        <span className="flex items-center gap-2">
          <Icon name="users" className="h-5 w-5 text-primary" />
          {t("detailSellerCount", { count: series.sellers.length })}
        </span>
      </div>
      {series.shortDescription ? (
        <p className="mt-5 line-clamp-4 whitespace-pre-line text-sm leading-7 text-muted">
          {series.shortDescription}
        </p>
      ) : null}
      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-muted">{t("detailBestCurrentPrice")}</p>
            <p className="text-4xl font-black text-primary">
              {formatPrice(series.latestPrice, series.currency ?? undefined, locale)}
            </p>
          </div>
          {discount ? (
            <div className="rounded-lg border border-primary/30 bg-white px-5 py-3 text-center">
              <p className="text-2xl font-black text-primary">-{discount} %</p>
              <p className="text-xs font-bold text-muted">{t("detailComparedWithReference")}</p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={`#${offersSectionId}`}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-extrabold text-white hover:bg-emerald-700"
        >
          <Icon name="cart" className="h-5 w-5" />
          {t("detailViewOffers")}
        </a>
      </div>
    </section>
  );
};
