export type AvailabilityFilter = "all" | "available" | "preorder";
export type CategoryFilter =
  | "strategicka"
  | "rodinna"
  | "fantasy"
  | "kooperativni"
  | "ekonomicka";
export type PlayerRangeFilter = "1-2" | "2-4" | "4-plus";
export type PlaytimeRangeFilter = "under-30" | "30-60" | "60-plus";
export type AgeRatingFilter = "6" | "8" | "10" | "12";
export type PriceMovementFilter = "decreased";

export interface ActiveFilterChip {
  key: string;
  label: string;
}
