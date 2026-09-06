import type { LocaleKey } from "../i18n/translations";

export const formatSellerCount = (count: number, locale: LocaleKey): string => {
  if (locale === "en") return `${count} ${count === 1 ? "shop" : "shops"}`;
  return `${count} ${count === 1 ? "e-shop" : count >= 2 && count <= 4 ? "e-shopy" : "e-shopů"}`;
};
