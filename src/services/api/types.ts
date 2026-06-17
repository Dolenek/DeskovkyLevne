import type {
  CatalogSearchRow,
  CategoryCountRow,
  ProductCatalogIndexRow,
  ProductRow,
} from "../../types/product";
import type { AvailabilityFilter } from "../../types/filters";
import type {
  AgeRatingFilter,
  CategoryFilter,
  PlayerRangeFilter,
  PlaytimeRangeFilter,
  PriceMovementFilter,
} from "../../types/filters";

export interface CatalogResponse {
  rows: ProductCatalogIndexRow[];
  total: number;
  total_estimate?: number;
}

export interface SearchResponse {
  rows: CatalogSearchRow[];
}

export interface SnapshotResponse {
  rows: ProductRow[];
}

export interface CategoriesResponse {
  rows: CategoryCountRow[];
}

export interface CatalogFilterOptions {
  availability?: AvailabilityFilter;
  minPrice?: number | null;
  maxPrice?: number | null;
  categories?: CategoryFilter[];
  playerRanges?: PlayerRangeFilter[];
  playtimeRanges?: PlaytimeRangeFilter[];
  ageRatings?: AgeRatingFilter[];
  priceMovement?: PriceMovementFilter | null;
  randomSeed?: number | null;
}

export interface FilteredCatalogResult {
  rows: ProductCatalogIndexRow[];
  total: number;
}

export interface FilterOptionRow {
  value: string;
  label: string;
}

export interface FilterOptionsResponse {
  categories: FilterOptionRow[];
  player_ranges: FilterOptionRow[];
  playtime_ranges: FilterOptionRow[];
  age_ratings: FilterOptionRow[];
  availability: FilterOptionRow[];
  price_movement: FilterOptionRow[];
}
