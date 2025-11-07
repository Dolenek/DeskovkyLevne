import { useCallback } from "react";
import { useLocale } from "../contexts/LocaleContext";
import {
  interpolate,
  translations,
  type LocaleKey,
  type TranslationKey,
  type TranslationValues,
} from "../i18n/translations";

export interface TranslationHook {
  locale: LocaleKey;
  setLocale: (value: LocaleKey) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

export const useTranslation = (): TranslationHook => {
  const { locale, setLocale } = useLocale();

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) => {
      const template = translations[locale][key];
      return interpolate(template, values);
    },
    [locale]
  );

  return { locale, setLocale, t };
};
