import type { LocaleKey } from "../../i18n/translations";
import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import { formatDateLabel } from "../../utils/date";
import { formatPrice } from "../../utils/numberFormat";
import { getPriceStats } from "../../utils/priceStats";
import { Icon, type IconName } from "../ui/Icon";

interface ProductPriceStatsProps {
  product: ProductSeries;
  locale: LocaleKey;
  t: Translator;
}

interface StatCard {
  icon: IconName;
  label: string;
  value: string;
  note: string;
}

const latestScrapedAt = (product: ProductSeries): string | null => {
  const timestamps = product.sellers
    .map((seller) => seller.latestScrapedAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  return timestamps[0] ?? product.latestScrapedAt ?? null;
};

export const ProductPriceStats = ({ product, locale, t }: ProductPriceStatsProps) => {
  const stats = getPriceStats(product);
  const lastRecord = latestScrapedAt(product);
  const priceFallback = t("detailPriceUnavailable");
  const cards: StatCard[] = [
    {
      icon: "tag",
      label: t("detailStatsLowest"),
      value: formatPrice(stats.minimum, product.currency ?? undefined, locale) ?? priceFallback,
      note: t("detailStatsLowestNote"),
    },
    {
      icon: "barChart",
      label: t("detailStatsHighest"),
      value: formatPrice(stats.maximum, product.currency ?? undefined, locale) ?? priceFallback,
      note: t("detailStatsHighestNote"),
    },
    {
      icon: "clock",
      label: t("detailStatsAverage"),
      value: formatPrice(stats.average, product.currency ?? undefined, locale) ?? priceFallback,
      note: t("detailStatsAverageNote"),
    },
    {
      icon: "store",
      label: t("detailStatsSellerCount"),
      value: t("detailSellerCount", { count: product.sellers.length }),
      note: lastRecord ? t("detailStatsLastRecord", { value: formatDateLabel(lastRecord, locale) }) : t("detailStatsNoRecord"),
    },
  ];

  return (
    <section>
      <h2 className="mb-5 text-2xl font-extrabold text-navy">{t("detailPriceStatsHeading")}</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <Icon name={card.icon} className="h-8 w-8 text-primary" />
            <p className="mt-3 text-sm font-bold text-muted">{card.label}</p>
            <p className="mt-1 text-xl font-black text-primary">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-muted">{card.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
