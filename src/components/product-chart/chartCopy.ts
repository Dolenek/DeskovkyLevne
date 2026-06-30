import { interpolate, translations, type LocaleKey, type TranslationKey } from "../../i18n/translations";

export const chartCopy = (
  locale: LocaleKey,
  key: TranslationKey,
  values?: Record<string, string | number>
): string => interpolate(translations[locale][key], values);
