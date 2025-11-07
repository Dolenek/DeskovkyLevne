import type { LocaleKey } from "../i18n/translations";

const formatterCache = new Map<string, Intl.NumberFormat>();

const getFormatter = (currency: string | null | undefined, locale: LocaleKey) => {
  const key = `${locale}-${currency ?? "CZK"}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
        style: "currency",
        currency: currency ?? "CZK",
        maximumFractionDigits: 2,
      })
    );
  }

  return formatterCache.get(key)!;
};

export const formatPrice = (
  value: number | null,
  currency: string | null | undefined,
  locale: LocaleKey
): string => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return getFormatter(currency, locale).format(value);
};
