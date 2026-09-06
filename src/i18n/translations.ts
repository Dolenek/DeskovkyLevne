import { cs } from "./cs";
import { en } from "./en";

export type LocaleKey = "cs" | "en";
export const translations: Record<LocaleKey, Record<string, string>> = { cs, en };
export type TranslationKey = keyof (typeof translations)["cs"];

export type TranslationValues = Record<string, string | number>;

export const interpolate = (template: string, values?: TranslationValues): string => {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
};
