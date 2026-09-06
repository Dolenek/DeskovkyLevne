import { useState } from "react";
import type { LocaleKey } from "../i18n/translations";
import type { Translator } from "../types/i18n";
import type { ProductSeries } from "../types/product";
import { currentOffers, isSellerAvailable, lowestAvailableSeller } from "../utils/productOffers";
import { SellerOfferRow } from "./product-detail/SellerOfferRow";

interface SellerOfferTableProps {
  series: ProductSeries;
  locale: LocaleKey;
  t: Translator;
  compact?: boolean;
}
export const SellerOfferTable = ({ series, locale, t, compact = false }: SellerOfferTableProps) => {
  const [expanded, setExpanded] = useState(false);
  const offers = currentOffers(series);
  const bestPrice = lowestAvailableSeller(series)?.latestPrice;
  const initialCount = compact ? 4 : 8;
  if (!offers.length)
    return <p className="rounded-lg border border-line bg-white p-5 text-muted">{t("detailNoOffers")}</p>;
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        {t("detailOfferOrdering")} {t("detailWithoutShipping")}
      </p>
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="hidden grid-cols-[1.25fr_0.75fr_1fr_0.85fr] gap-3 border-b border-line bg-slate-50 px-4 py-3 text-xs font-bold md:grid">
          <span>{t("sellerOfferShop")}</span>
          <span>{t("sellerOfferPrice")}</span>
          <span>{t("sellerOfferAvailability")}</span>
          <span className="text-right">{t("sellerOfferLink")}</span>
        </div>
        <div className="divide-y divide-line">
          {offers.slice(0, expanded ? undefined : initialCount).map((seller) => (
            <SellerOfferRow
              key={`${seller.seller}-${seller.productCode}`}
              seller={seller}
              best={isSellerAvailable(seller) && seller.latestPrice === bestPrice}
              currency={series.currency}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      </div>
      {offers.length > initialCount ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="mt-3 min-h-11 w-full rounded-lg border border-line bg-white px-4 py-3 font-bold text-primary"
        >
          {expanded ? t("detailFewerOffers") : t("detailAllOffers", { count: offers.length })}
        </button>
      ) : null}
    </div>
  );
};
