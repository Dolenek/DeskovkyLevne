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
    <article className="flex flex-col gap-4 rounded-3xl border border-outline bg-surface/90 p-6 shadow-card backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted">
          {discount.productSlug}
        </p>
        <h3 className="text-xl font-semibold text-ink">
          {discount.productName}
        </h3>
        <p className="text-sm text-muted">
          {t("discountOccurred", { value: formattedDate })}
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-outline bg-surface-muted p-4 text-sm text-muted">
        <div className="flex items-center justify-between">
          <span className="text-muted">{t("fromPrice")}</span>
          <span className="font-semibold text-accent">
            {formatPrice(
              discount.previousPrice,
              discount.currency ?? undefined,
              locale
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">{t("toPrice")}</span>
          <span className="font-semibold text-secondary">
            {formatPrice(
              discount.currentPrice,
              discount.currency ?? undefined,
              locale
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Δ</span>
          <span className="font-semibold text-secondary">
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
          className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-ink transition hover:bg-primary/15"
        >
          {t("viewProduct")}
        </a>
      ) : null}
    </article>
  );
};
