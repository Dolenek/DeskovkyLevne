import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import { formatPrice } from "../../utils/numberFormat";
import { currentOffers, lowestAvailableSeller } from "../../utils/productOffers";
import { productFacts } from "../../utils/productFacts";
import { formatSellerCount } from "../../utils/sellerCount";
import { Icon } from "../ui/Icon";
import { ProductBreadcrumb } from "./ProductBreadcrumb";

interface ProductHeroProps {
  series: ProductSeries;
  locale: Parameters<typeof formatPrice>[2];
  offersSectionId: string;
  t: Translator;
  onNavigate: (path: string) => void;
}

const HeroPrice = ({ series, locale, offersSectionId, t }: ProductHeroProps) => {
  const available = lowestAvailableSeller(series);
  const seller = available ?? currentOffers(series)[0];
  return (
    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-bold text-muted">
        {t(available ? "detailCheapestAvailable" : "detailLowestListed")}
      </p>
      <p className="text-3xl font-black text-primary sm:text-4xl">
        {seller
          ? formatPrice(seller.latestPrice, seller.currency ?? series.currency, locale)
          : t("detailPriceUnavailable")}
      </p>
      {seller ? <p className="mt-1 text-xs text-muted">{t("detailWithoutShipping")}</p> : null}
      {!available && seller ? <p className="mt-2 text-sm text-muted">{t("detailNoStock")}</p> : null}
      {seller ? (
        <a
          href={`#${offersSectionId}`}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-white hover:bg-emerald-700"
        >
          <Icon name="cart" className="h-5 w-5" />
          {t("detailViewOffers")}
        </a>
      ) : null}
    </div>
  );
};

export const ProductHero = (props: ProductHeroProps) => {
  const { series, locale, t, onNavigate } = props;
  const facts = productFacts(series.supplementaryParameters, t);
  return (
    <section className="min-w-0">
      <ProductBreadcrumb label={series.label} t={t} onNavigate={onNavigate} />
      <h1 className="mt-3 break-words text-3xl font-black leading-tight text-navy sm:text-4xl">
        {series.label}
      </h1>
      <p className="mt-2 text-sm font-semibold text-muted">
        {series.categoryTags.slice(0, 2).join(" · ") || t("detailFallbackCategory")}
      </p>
      {facts.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {facts.map((fact) => (
            <div key={fact.name}>
              <dt className="text-muted">{fact.name}</dt>
              <dd className="font-bold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <HeroPrice {...props} />
      <p className="mt-3 text-sm text-muted">{formatSellerCount(series.sellers.length, locale)}</p>
      {series.shortDescription ? (
        <p className="mt-4 hidden line-clamp-3 whitespace-pre-line text-sm leading-7 text-muted lg:block">
          {series.shortDescription}
        </p>
      ) : null}
    </section>
  );
};
