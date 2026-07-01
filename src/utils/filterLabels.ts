import type { TranslationKey } from "../i18n/translations";
import type { Translator } from "../types/i18n";

export type FilterOptionGroup =
  | "categories"
  | "availability"
  | "price_movement"
  | "playtime_ranges";

const FILTER_OPTION_KEYS: Record<FilterOptionGroup, Record<string, TranslationKey>> = {
  categories: {
    strategicka: "filterCategoryStrategic",
    rodinna: "filterCategoryFamily",
    fantasy: "filterCategoryFantasy",
    kooperativni: "filterCategoryCooperative",
    ekonomicka: "filterCategoryEconomic",
  },
  availability: {
    available: "availabilityInStock",
    preorder: "availabilityPreorder",
  },
  price_movement: {
    decreased: "filtersOnSale",
  },
  playtime_ranges: {
    "under-30": "filterPlaytimeUnder30",
    "30-60": "filterPlaytime30To60",
    "60-plus": "filterPlaytime60Plus",
  },
};

export const translateFilterOptionLabel = (
  group: FilterOptionGroup,
  value: string,
  fallback: string,
  t: Translator
) => {
  const key = FILTER_OPTION_KEYS[group][value];
  return key ? t(key) : fallback;
};
