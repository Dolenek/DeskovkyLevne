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

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDateOnly = (value: string): Date | null => {
  const match = value.match(DATE_ONLY_PATTERN);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) return null;
  return parsed;
};

export const formatDateLabel = (value: string, locale: LocaleKey): string => {
  const isDateOnly = DATE_ONLY_PATTERN.test(value);
  const date = isDateOnly ? parseDateOnly(value) : new Date(value);
  if (!date || Number.isNaN(date.getTime())) {
    return "--";
  }

  return getFormatter(locale).format(date);
};

export const toDateKey = (value: string): string => {
  if (DATE_ONLY_PATTERN.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
