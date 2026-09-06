import { useEffect, useReducer } from "react";
import {
  buildCatalogStatePath,
  readCatalogSelection,
  type CatalogSelection,
} from "../../routing/catalogState";
import type { Translator } from "../../types/i18n";
import { useFilterOptions } from "../../hooks/useFilterOptions";
import { useCatalogPriceBounds } from "../../hooks/useCatalogPriceBounds";
import { buildActiveFilterChips } from "./searchPageFilters";
import { buildNormalizedPriceRange, toPriceFilterStrings } from "./searchPriceRange";
import { catalogSelectionReducer, type SelectionAction } from "./catalogSelectionReducer";
import type { Dispatch } from "react";

const selectionActions = (selection: CatalogSelection, dispatch: Dispatch<SelectionAction>) => ({
  setPricePage: (pricePage: number) => dispatch({ type: "set", changes: { pricePage }, keepPage: true }),
  setSort: (sort: CatalogSelection["sort"]) => dispatch({ type: "set", changes: { sort } }),
  setAvailabilityFilter: (availabilityFilter: CatalogSelection["availabilityFilter"]) =>
    dispatch({ type: "set", changes: { availabilityFilter } }),
  handleCategoryToggle: (value: CatalogSelection["categoryFilters"][number]) =>
    dispatch({ type: "toggle", key: "categoryFilters", value }),
  handlePlayerRangeToggle: (value: CatalogSelection["playerRangeFilters"][number]) =>
    dispatch({ type: "toggle", key: "playerRangeFilters", value }),
  handlePlaytimeRangeToggle: (value: CatalogSelection["playtimeRangeFilters"][number]) =>
    dispatch({ type: "toggle", key: "playtimeRangeFilters", value }),
  handleAgeRatingToggle: (value: CatalogSelection["ageRatingFilters"][number]) =>
    dispatch({ type: "toggle", key: "ageRatingFilters", value }),
  handleSaleToggle: () =>
    dispatch({
      type: "set",
      changes: { priceMovementFilter: selection.priceMovementFilter ? null : "decreased" },
    }),
  resetFilters: () => dispatch({ type: "reset" }),
  removeFilter: (key: string) => dispatch({ type: "remove", key }),
  handlePriceFilterChange: (key: "min" | "max", value: string) =>
    dispatch({ type: "set", changes: { priceFilter: { ...selection.priceFilter, [key]: value } } }),
  handlePriceFilterBlur: () =>
    dispatch({
      type: "set",
      changes: {
        priceFilter: toPriceFilterStrings(
          buildNormalizedPriceRange(selection.priceFilter.min, selection.priceFilter.max),
        ),
      },
    }),
  handleSliderChange: (key: "min" | "max", value: number) =>
    dispatch({
      type: "set",
      changes: { priceFilter: { ...selection.priceFilter, [key]: String(Math.max(0, Math.round(value))) } },
    }),
});

export const useCatalogSelection = (query: string, t: Translator) => {
  const [selection, dispatch] = useReducer(
    catalogSelectionReducer,
    window.location.search,
    readCatalogSelection,
  );
  const { options: filterOptions } = useFilterOptions();
  const priceRange = buildNormalizedPriceRange(selection.priceFilter.min, selection.priceFilter.max);
  const { bounds: priceBounds } = useCatalogPriceBounds(
    selection.availabilityFilter,
    selection.categoryFilters,
    selection.playerRangeFilters,
    selection.playtimeRangeFilters,
    selection.ageRatingFilters,
    selection.priceMovementFilter,
  );
  const activeFilterChips = buildActiveFilterChips(priceRange, filterOptions, t, selection);
  useEffect(() => {
    window.history.replaceState(window.history.state, "", buildCatalogStatePath(query, selection));
  }, [query, selection]);
  return {
    ...selection,
    ...selectionActions(selection, dispatch),
    filterOptions,
    priceRange,
    priceBounds,
    activeFilterChips,
    activeFilterCount: activeFilterChips.length,
  };
};
