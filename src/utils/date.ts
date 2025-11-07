import type { LocaleKey } from "../i18n/translations";

const formatterCache = new Map<LocaleKey, Intl.DateTimeFormat>();

const getFormatter = (locale: LocaleKey) => {
  if (!formatterCache.has(locale)) {
    formatterCache.set(
      locale,
      new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );
  }

  return formatterCache.get(locale)!;
};

export const formatDateLabel = (value: string, locale: LocaleKey): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return getFormatter(locale).format(date);
};

export const toDateKey = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
