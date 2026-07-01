import type { LocaleKey } from "../i18n/translations";
import type { Translator } from "../types/i18n";
import type { ProductSeries } from "../types/product";
import { formatAvailabilityLabel, getAvailabilityTone } from "../utils/availability";
import { formatPrice } from "../utils/numberFormat";
import { getLatestComparablePrice } from "../utils/priceStats";
import { getSellerDisplayName } from "../utils/sellers";
import { Icon } from "./ui/Icon";

interface SellerOfferTableProps {
  series: ProductSeries;
  locale: LocaleKey;
  t: Translator;
  compact?: boolean;
}

const toneClassName = (availabilityLabel: string | null | undefined) => {
  const tone = getAvailabilityTone(availabilityLabel);
  if (tone === "available") {
    return "bg-primary";
  }
  if (tone === "unavailable") {
    return "bg-slate-400";
  }
  if (tone === "preorder") {
    return "bg-accent";
  }
  return "bg-muted";
};

export const SellerOfferTable = ({
  series,
  locale,
  t,
  compact = false,
}: SellerOfferTableProps) => {
  const sellers = [...series.sellers]
    .filter((seller) => getLatestComparablePrice(seller) !== null)
    .sort(
      (a, b) =>
        (getLatestComparablePrice(a) ?? Number.POSITIVE_INFINITY) -
        (getLatestComparablePrice(b) ?? Number.POSITIVE_INFINITY)
    );

  if (sellers.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="hidden grid-cols-[1.25fr_0.75fr_1fr_0.85fr] gap-3 border-b border-line bg-slate-50 px-4 py-3 text-xs font-extrabold text-navy md:grid">
        <span>{t("sellerOfferShop")}</span>
        <span>{t("sellerOfferPrice")}</span>
        <span>{t("sellerOfferAvailability")}</span>
        <span className="text-right">{t("sellerOfferLink")}</span>
      </div>
      <div className="divide-y divide-line">
        {sellers.slice(0, compact ? 4 : 8).map((seller, index) => (
          <div
            key={`${seller.seller}-${seller.productCode}-${index}`}
            className={`grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.25fr_0.75fr_1fr_0.85fr] md:items-center ${
              index === 0 ? "bg-emerald-50/70" : "bg-white"
            }`}
          >
            <span className="flex items-center justify-between gap-3 font-extrabold text-navy md:justify-start">
              <span className="flex items-center gap-2">
                {index === 0 ? <Icon name="trophy" className="h-4 w-4 text-accent" /> : null}
                {getSellerDisplayName(seller.seller)}
              </span>
              <span className="text-xs font-bold text-muted md:hidden">{t("sellerOfferShop")}</span>
            </span>
            <span className="flex items-center justify-between gap-3 text-lg font-extrabold text-primary md:block">
              <span>{formatPrice(getLatestComparablePrice(seller), seller.currency ?? series.currency ?? undefined, locale)}</span>
              <span className="text-xs font-bold text-muted md:hidden">{t("sellerOfferPrice")}</span>
            </span>
            <span className="flex items-center justify-between gap-3 text-muted md:justify-start">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${toneClassName(seller.availabilityLabel)}`} />
                {formatAvailabilityLabel(seller.availabilityLabel, locale)}
              </span>
              <span className="text-xs font-bold text-muted md:hidden">{t("sellerOfferAvailability")}</span>
            </span>
            <span className="text-right">
              {seller.url ? (
                <a
                  href={seller.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("sellerOfferOpenAria", { seller: getSellerDisplayName(seller.seller) })}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                >
                  {t("sellerOfferGoToShop")}
                  <Icon name="external" className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-muted">--</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
