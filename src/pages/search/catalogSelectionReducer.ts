import { readCatalogSelection, type CatalogSelection } from "../../routing/catalogState";

type ArrayKey = "categoryFilters" | "playerRangeFilters" | "playtimeRangeFilters" | "ageRatingFilters";
export type SelectionAction =
  | { type: "set"; changes: Partial<CatalogSelection>; keepPage?: boolean }
  | { type: "toggle"; key: ArrayKey; value: string }
  | { type: "remove"; key: string }
  | { type: "reset" };

const removeChip = (selection: CatalogSelection, key: string): CatalogSelection => {
  if (key === "price") return { ...selection, priceFilter: { min: "", max: "" } };
  if (key.startsWith("availability-")) return { ...selection, availabilityFilter: "all" };
  if (key.startsWith("movement-")) return { ...selection, priceMovementFilter: null };
  const groups: Record<string, ArrayKey> = {
    category: "categoryFilters",
    players: "playerRangeFilters",
    playtime: "playtimeRangeFilters",
    age: "ageRatingFilters",
  };
  const separator = key.indexOf("-");
  const group = groups[key.slice(0, separator)];
  return group
    ? { ...selection, [group]: selection[group].filter((value) => value !== key.slice(separator + 1)) }
    : selection;
};

export const catalogSelectionReducer = (
  selection: CatalogSelection,
  action: SelectionAction,
): CatalogSelection => {
  if (action.type === "reset") return { ...readCatalogSelection(""), sort: selection.sort };
  if (action.type === "remove") return { ...removeChip(selection, action.key), pricePage: 1 };
  if (action.type === "set")
    return {
      ...selection,
      ...action.changes,
      pricePage: action.keepPage ? (action.changes.pricePage ?? selection.pricePage) : 1,
    };
  const values = selection[action.key] as string[];
  return {
    ...selection,
    pricePage: 1,
    [action.key]: values.includes(action.value)
      ? values.filter((value) => value !== action.value)
      : [...values, action.value],
  };
};
