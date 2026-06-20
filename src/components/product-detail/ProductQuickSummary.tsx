import type { LocaleKey } from "../../i18n/translations";
import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import { formatAvailabilityLabel } from "../../utils/availability";
import { formatPrice } from "../../utils/numberFormat";
import { Icon } from "../ui/Icon";

interface ProductQuickSummaryProps {
  product: ProductSeries;
  locale: LocaleKey;
  t: Translator;
}

const getPriceTrend = (product: ProductSeries, t: Translator): string => {
  if (product.latestPrice === null || product.previousPrice === null) {
    return t("detailPriceTrendUnknown");
  }
  if (product.latestPrice < product.previousPrice) {
    return t("detailPriceTrendDown");
  }
  if (product.latestPrice > product.previousPrice) {
    return t("detailPriceTrendUp");
  }
  return t("detailPriceTrendStable");
};

export const ProductQuickSummary = ({ product, locale, t }: ProductQuickSummaryProps) => (
  <aside className="rounded-lg border border-line bg-white p-6 shadow-sm">
    <h2 className="text-lg font-extrabold text-navy">{t("detailQuickSummaryTitle")}</h2>
    <div className="mt-5 space-y-5">
      <div className="flex items-center gap-4">
        <Icon name="tag" className="h-9 w-9 text-primary" />
        <div>
          <p className="font-extrabold text-navy">{t("detailBestPriceToday")}</p>
          <p className="text-sm font-bold text-primary">
            {formatPrice(product.latestPrice, product.currency ?? undefined, locale) ?? t("detailPriceUnavailable")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Icon name="barChart" className="h-9 w-9 text-primary" />
        <div>
          <p className="font-extrabold text-navy">{t("detailPriceTrendTitle")}</p>
          <p className="text-sm text-muted">{getPriceTrend(product, t)}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Icon name="store" className="h-9 w-9 text-primary" />
        <div>
          <p className="font-extrabold text-navy">{t("detailAvailabilityByShops")}</p>
          <p className="text-sm text-muted">{formatAvailabilityLabel(product.availabilityLabel)}</p>
        </div>
      </div>
    </div>
  </aside>
);
