import { createContext } from "react";
import type { LocaleKey } from "../i18n/translations";

export const LOCALE_STORAGE_KEY = "deskovky-levne-locale";
export const PREVIOUS_LOCALE_STORAGE_KEY = "tlama-site-locale";

export interface LocaleContextValue {
  locale: LocaleKey;
  setLocale: (value: LocaleKey) => void;
}

export const LocaleContext = createContext<LocaleContextValue | undefined>(
  undefined
);

export const getInitialLocale = (): LocaleKey => {
  if (typeof window === "undefined") {
    return "cs";
  }

  const stored = (window.localStorage.getItem(LOCALE_STORAGE_KEY) ??
    window.localStorage.getItem(PREVIOUS_LOCALE_STORAGE_KEY)) as
    | LocaleKey
    | null;
  if (stored === "cs" || stored === "en") {
    return stored;
  }

  return "cs";
};
