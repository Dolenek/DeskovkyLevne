import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import type { LocaleKey } from "../../i18n/translations";
import { formatDateLabel } from "../../utils/date";
import { formatSellerCount } from "../../utils/sellerCount";
import { currentOffers, latestOfferCheck } from "../../utils/productOffers";

export const ProductDataSummary = ({
  product,
  t,
  locale,
}: {
  product: ProductSeries;
  t: Translator;
  locale: LocaleKey;
}) => {
  const latest = latestOfferCheck(product);
  return (
    <article className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold">{t("detailPriceCoverage")}</h2>
      <p className="mt-4 font-bold">{formatSellerCount(product.sellers.length, locale)}</p>
      <p className="mt-2 text-sm text-muted">
        {t("detailPricedOffers", { count: currentOffers(product).length })}
      </p>
      <p className="mt-3 text-sm text-muted">
        {latest
          ? t("detailLatestCheck", { value: formatDateLabel(latest, locale) })
          : t("detailStatsNoRecord")}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">{t("detailCheckExplanation")}</p>
    </article>
  );
};
