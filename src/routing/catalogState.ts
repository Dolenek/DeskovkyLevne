import type {
  AgeRatingFilter,
  AvailabilityFilter,
  CatalogSort,
  CategoryFilter,
  PlayerRangeFilter,
  PlaytimeRangeFilter,
  PriceMovementFilter,
} from "../types/filters";
import { buildCatalogSearchPath } from "./catalogSearch";
import { buildNormalizedPriceRange, toPriceFilterStrings } from "../pages/search/searchPriceRange";

export interface CatalogSelection {
  availabilityFilter: AvailabilityFilter;
  categoryFilters: CategoryFilter[];
  playerRangeFilters: PlayerRangeFilter[];
  playtimeRangeFilters: PlaytimeRangeFilter[];
  ageRatingFilters: AgeRatingFilter[];
  priceMovementFilter: PriceMovementFilter | null;
  priceFilter: { min: string; max: string };
  pricePage: number;
  sort: CatalogSort;
}

const enumValues = <T extends string>(params: URLSearchParams, key: string, allowed: T[]): T[] =>
  [...new Set((params.get(key) ?? "").split(","))].filter((value): value is T =>
    allowed.includes(value as T),
  );

export const readCatalogSelection = (search: string): CatalogSelection => {
  const params = new URLSearchParams(search);
  const page = Number(params.get("page") ?? "1");
  return {
    availabilityFilter: enumValues(params, "availability", ["available", "preorder"])[0] ?? "all",
    categoryFilters: enumValues(params, "categories", [
      "strategicka",
      "rodinna",
      "fantasy",
      "kooperativni",
      "ekonomicka",
    ]),
    playerRangeFilters: enumValues(params, "players", ["1-2", "2-4", "4-plus"]),
    playtimeRangeFilters: enumValues(params, "playtime", ["under-30", "30-60", "60-plus"]),
    ageRatingFilters: enumValues(params, "age", ["6", "8", "10", "12"]),
    priceMovementFilter: enumValues(params, "price_movement", ["decreased"])[0] ?? null,
    priceFilter: toPriceFilterStrings(
      buildNormalizedPriceRange(params.get("min_price") ?? "", params.get("max_price") ?? ""),
    ),
    pricePage: Number.isInteger(page) ? Math.max(1, Math.min(page, 100001)) : 1,
    sort: enumValues(params, "sort", ["name", "price_asc", "price_desc"])[0] ?? "name",
  };
};

export const buildCatalogStatePath = (query: string, selection: CatalogSelection): string => {
  const url = new URL(buildCatalogSearchPath(query), "https://catalog.local");
  const price = buildNormalizedPriceRange(selection.priceFilter.min, selection.priceFilter.max);
  const entries = {
    availability: selection.availabilityFilter === "all" ? "" : selection.availabilityFilter,
    categories: selection.categoryFilters.join(","),
    players: selection.playerRangeFilters.join(","),
    playtime: selection.playtimeRangeFilters.join(","),
    age: selection.ageRatingFilters.join(","),
    price_movement: selection.priceMovementFilter ?? "",
    min_price: price.min,
    max_price: price.max,
    page: selection.pricePage > 1 ? selection.pricePage : null,
    sort: selection.sort === "name" ? "" : selection.sort,
  };
  Object.entries(entries).forEach(([key, value]) => {
    if (value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  return url.pathname + url.search;
};
