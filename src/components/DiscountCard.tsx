import type { DiscountEntry } from "../types/product";
import type { LocaleKey } from "../i18n/translations";
import { formatPrice } from "../utils/numberFormat";
import { formatDateLabel } from "../utils/date";
import type { TranslationHook } from "../hooks/useTranslation";

interface DiscountCardProps {
  discount: DiscountEntry;
  locale: LocaleKey;
  t: TranslationHook["t"];
}

export const DiscountCard = ({ discount, locale, t }: DiscountCardProps) => {
  const delta = discount.currentPrice - discount.previousPrice;
  const formattedDate = formatDateLabel(discount.changedAt, locale);

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-surface/80 p-6 shadow-xl shadow-black/40 backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">
          {discount.productCode}
        </p>
        <h3 className="text-xl font-semibold text-white">
          {discount.productName}
        </h3>
        <p className="text-sm text-slate-400">
          {t("discountOccurred", { value: formattedDate })}
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-black/20 p-4 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t("fromPrice")}</span>
          <span className="font-semibold text-rose-200">
            {formatPrice(
              discount.previousPrice,
              discount.currency ?? undefined,
              locale
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t("toPrice")}</span>
          <span className="font-semibold text-emerald-300">
            {formatPrice(
              discount.currentPrice,
              discount.currency ?? undefined,
              locale
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Δ</span>
          <span className="font-semibold text-emerald-400">
            {formatPrice(
              delta,
              discount.currency ?? undefined,
              locale
            )}
          </span>
        </div>
      </div>

      {discount.url ? (
        <a
          href={discount.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/20"
        >
          {t("viewProduct")}
        </a>
      ) : null}
    </article>
  );
};
