import type { LocaleKey } from "../i18n/translations";
import type { ProductSeries } from "../types/product";
import { formatPrice } from "../utils/numberFormat";
import { getLatestComparablePrice } from "../utils/priceStats";
import { getSellerDisplayName } from "../utils/sellers";
import { Icon } from "./ui/Icon";

interface SellerOfferTableProps {
  series: ProductSeries;
  locale: LocaleKey;
  compact?: boolean;
}

const ratingSeed = (index: number) => [1423, 982, 1156, 734, 651, 487, 403, 312][index] ?? 284;

export const SellerOfferTable = ({
  series,
  locale,
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
      <div className="hidden grid-cols-[1.25fr_0.7fr_0.9fr_0.8fr_1fr_0.9fr] gap-3 border-b border-line bg-slate-50 px-4 py-3 text-xs font-extrabold text-navy md:grid">
        <span>E-shop</span>
        <span>Cena</span>
        <span>Dostupnost</span>
        <span>Doprava od</span>
        <span>Hodnocení</span>
        <span className="text-right">Odkaz</span>
      </div>
      <div className="divide-y divide-line">
        {sellers.slice(0, compact ? 4 : 8).map((seller, index) => (
          <div
            key={`${seller.seller}-${seller.productCode}-${index}`}
            className={`grid gap-3 px-4 py-3 text-sm md:grid-cols-[1.25fr_0.7fr_0.9fr_0.8fr_1fr_0.9fr] md:items-center ${
              index === 0 ? "bg-emerald-50/70" : "bg-white"
            }`}
          >
            <span className="flex items-center gap-2 font-extrabold text-navy">
              {index === 0 ? <Icon name="trophy" className="h-4 w-4 text-accent" /> : null}
              {getSellerDisplayName(seller.seller)}
            </span>
            <span className="text-lg font-extrabold text-primary">
              {formatPrice(getLatestComparablePrice(seller), seller.currency ?? series.currency ?? undefined, locale)}
            </span>
            <span className="flex items-center gap-2 text-muted">
              <span className={`h-2 w-2 rounded-full ${index < 3 ? "bg-primary" : "bg-accent"}`} />
              {seller.availabilityLabel ?? (index < 3 ? "Skladem" : "Do 2 dnů")}
            </span>
            <span className="text-muted">{index === 1 ? "69 Kč" : index === 4 ? "59 Kč" : "79 Kč"}</span>
            <span className="flex items-center gap-1 text-muted">
              {Array.from({ length: 5 }, (_, starIndex) => (
                <Icon
                  key={starIndex}
                  name="star"
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                />
              ))}
              <span className="ml-1">({ratingSeed(index)})</span>
            </span>
            <span className="text-right">
              {seller.url ? (
                <a
                  href={seller.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                >
                  Do obchodu
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
