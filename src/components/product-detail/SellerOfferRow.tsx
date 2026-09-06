import type { SellerSeries } from "../../types/product";
import type { LocaleKey } from "../../i18n/translations";
import type { Translator } from "../../types/i18n";
import { formatAvailabilityLabel, getAvailabilityTone } from "../../utils/availability";
import { formatPrice } from "../../utils/numberFormat";
import { formatDateLabel } from "../../utils/date";
import { getSellerDisplayName } from "../../utils/sellers";
import { sanitizeExternalHttpsUrl } from "../../utils/urls";
import { Icon } from "../ui/Icon";

interface OfferRowProps {
  seller: SellerSeries;
  best: boolean;
  currency?: string | null;
  locale: LocaleKey;
  t: Translator;
}
const toneClasses = {
  available: "text-primary",
  unavailable: "text-muted",
  preorder: "text-accent",
  unknown: "text-muted",
};

export const SellerOfferRow = ({ seller, best, currency, locale, t }: OfferRowProps) => {
  const url = sanitizeExternalHttpsUrl(seller.url);
  const name = getSellerDisplayName(seller.seller);
  return (
    <div
      className={`grid grid-cols-2 items-center gap-3 px-4 py-4 text-sm md:grid-cols-[1.25fr_0.75fr_1fr_0.85fr] ${best ? "bg-emerald-50/70" : "bg-white"}`}
    >
      <div>
        <p className="flex items-center gap-2 font-bold">
          {best ? <Icon name="trophy" className="h-4 w-4 shrink-0 text-accent" /> : null}
          {name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {seller.latestScrapedAt
            ? t("detailOfferChecked", { value: formatDateLabel(seller.latestScrapedAt, locale) })
            : t("detailStatsNoRecord")}
        </p>
      </div>
      <div className="text-right text-lg font-extrabold text-primary md:text-left">
        {formatPrice(seller.latestPrice, seller.currency ?? currency, locale)}
        {best ? <p className="text-xs font-semibold">{t("detailCheapestAvailable")}</p> : null}
      </div>
      <span className={toneClasses[getAvailabilityTone(seller.availabilityLabel)]}>
        {formatAvailabilityLabel(seller.availabilityLabel, locale)}
      </span>
      <OfferLink url={url} name={name} t={t} />
    </div>
  );
};

const OfferLink = ({ url, name, t }: { url: string | null; name: string; t: Translator }) => (
  <span className="text-right">
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={t("sellerOfferOpenAria", { seller: name })}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
      >
        {t("sellerOfferGoToShop")}
        <Icon name="external" className="h-3.5 w-3.5" />
      </a>
    ) : (
      <span className="text-xs text-muted">{t("detailLinkUnavailable")}</span>
    )}
  </span>
);
