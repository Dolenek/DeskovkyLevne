import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LocaleKey } from "../i18n/translations";
import {
  getInitialLocale,
  LocaleContext,
  LOCALE_STORAGE_KEY,
  PREVIOUS_LOCALE_STORAGE_KEY,
} from "./localeContext.shared";

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<LocaleKey>(() => {
    try {
      return getInitialLocale();
    } catch {
      return "cs";
    }
  });

  const setLocale = useCallback((value: LocaleKey) => {
    setLocaleState(value);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
      window.localStorage.removeItem(PREVIOUS_LOCALE_STORAGE_KEY);
    } catch {
      // localStorage might be unavailable (SSR / private mode), safe to ignore.
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};
