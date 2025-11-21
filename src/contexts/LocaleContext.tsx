import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LocaleKey } from "../i18n/translations";

const LOCALE_STORAGE_KEY = "deskovky-levne-locale";
const PREVIOUS_LOCALE_STORAGE_KEY = "tlama-site-locale";

interface LocaleContextValue {
  locale: LocaleKey;
  setLocale: (value: LocaleKey) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const getInitialLocale = (): LocaleKey => {
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

export const useLocale = (): LocaleContextValue => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
};
