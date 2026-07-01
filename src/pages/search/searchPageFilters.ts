import type {
  ActiveFilterChip,
  AgeRatingFilter,
  AvailabilityFilter,
  CategoryFilter,
  PlayerRangeFilter,
  PlaytimeRangeFilter,
  PriceMovementFilter,
} from "../../types/filters";
import type { Translator } from "../../types/i18n";
import type { ProductSearchResult } from "../../types/product";
import type { FilterOptionRow, FilterOptionsResponse } from "../../services/api/types";
import { translateFilterOptionLabel } from "../../utils/filterLabels";

type ActiveFilterSelection = {
  availabilityFilter: AvailabilityFilter;
  categoryFilters: CategoryFilter[];
  playerRangeFilters: PlayerRangeFilter[];
  playtimeRangeFilters: PlaytimeRangeFilter[];
  ageRatingFilters: AgeRatingFilter[];
  priceMovementFilter: PriceMovementFilter | null;
};

const findOptionLabel = (options: FilterOptionRow[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

const translateOptionChipLabel = (
  groupKey: string,
  value: string,
  fallback: string,
  t: Translator
) => {
  if (groupKey === "category") {
    return translateFilterOptionLabel("categories", value, fallback, t);
  }
  if (groupKey === "playtime") {
    return translateFilterOptionLabel("playtime_ranges", value, fallback, t);
  }
  return fallback;
};

const buildOptionChips = <T extends string>(
  groupKey: string,
  values: T[],
  options: FilterOptionRow[],
  t: Translator
): ActiveFilterChip[] =>
  values.map((value) => ({
    key: `${groupKey}-${value}`,
    label: translateOptionChipLabel(groupKey, value, findOptionLabel(options, value), t),
  }));

const buildPriceChip = (
  priceRange: { min: number | null; max: number | null },
  t: Translator
): ActiveFilterChip[] =>
  priceRange.min !== null || priceRange.max !== null
    ? [
        {
          key: "price",
          label: `${priceRange.min ?? t("priceChipAny")} - ${priceRange.max ?? t("priceChipAny")} Kč`,
        },
      ]
    : [];

const buildAvailabilityChip = (
  availabilityFilter: AvailabilityFilter,
  filterOptions: FilterOptionsResponse,
  t: Translator
): ActiveFilterChip[] =>
  availabilityFilter === "all"
    ? []
    : [
        {
          key: `availability-${availabilityFilter}`,
          label: translateFilterOptionLabel(
            "availability",
            availabilityFilter,
            findOptionLabel(filterOptions.availability, availabilityFilter),
            t
          ),
        },
      ];

const buildPriceMovementChip = (
  priceMovementFilter: PriceMovementFilter | null,
  filterOptions: FilterOptionsResponse,
  t: Translator
): ActiveFilterChip[] =>
  priceMovementFilter
    ? [
        {
          key: `movement-${priceMovementFilter}`,
          label: translateFilterOptionLabel(
            "price_movement",
            priceMovementFilter,
            findOptionLabel(filterOptions.price_movement, priceMovementFilter),
            t
          ),
        },
      ]
    : [];

export const buildActiveFilterChips = (
  priceRange: { min: number | null; max: number | null },
  filterOptions: FilterOptionsResponse,
  t: Translator,
  filters: ActiveFilterSelection
): ActiveFilterChip[] => [
  ...buildPriceChip(priceRange, t),
  ...buildAvailabilityChip(filters.availabilityFilter, filterOptions, t),
  ...buildOptionChips("category", filters.categoryFilters, filterOptions.categories, t),
  ...buildOptionChips("players", filters.playerRangeFilters, filterOptions.player_ranges, t),
  ...buildOptionChips("playtime", filters.playtimeRangeFilters, filterOptions.playtime_ranges, t),
  ...buildOptionChips("age", filters.ageRatingFilters, filterOptions.age_ratings, t),
  ...buildPriceMovementChip(filters.priceMovementFilter, filterOptions, t),
];

export const filterSearchResultsByCategory = (
  rows: ProductSearchResult[],
  selectedCategories: CategoryFilter[]
) => {
  if (selectedCategories.length === 0) {
    return rows;
  }
  const categoryLabels: Record<CategoryFilter, string[]> = {
    strategicka: ["Strategická"],
    rodinna: ["Rodinná"],
    fantasy: ["Fantasy"],
    kooperativni: ["Kooperativní", "Cooperative Game"],
    ekonomicka: ["Ekonomické"],
  };
  return rows.filter((series) =>
    selectedCategories.some((category) =>
      categoryLabels[category].some((label) => series.categoryTags.includes(label))
    )
  );
};
