import type { TranslationKey, TranslationValues } from "../i18n/translations";

export type Translator = (
  key: TranslationKey,
  values?: TranslationValues
) => string;
