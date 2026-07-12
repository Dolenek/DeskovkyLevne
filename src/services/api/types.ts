import type {
  CatalogSearchRow,
  ProductCatalogIndexRow,
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

export interface ProductHistoryPointResponse {
  price_date: string;
  price_with_vat: number | null;
  list_price_with_vat: number | null;
  currency_code: string | null;
  scraped_at: string;
  snapshot_count: number;
}

export interface ProductSellerResponse {
  seller: string;
  product_code: string | null;
  product_name: string | null;
  currency_code: string | null;
  availability_label: string | null;
  stock_status_label: string | null;
  latest_price: number | null;
  previous_price: number | null;
  first_price: number | null;
  list_price_with_vat: number | null;
  source_url: string | null;
  latest_scraped_at: string | null;
  hero_image_url: string | null;
  gallery_image_urls: string[];
  short_description: string | null;
  supplementary_parameters: Record<string, unknown> | unknown[] | string | null;
  metadata: Record<string, unknown> | null;
  history: ProductHistoryPointResponse[];
}

export interface ProductDetailResponse {
  product_name_normalized: string;
  sellers: ProductSellerResponse[];
}

export interface RecentDiscountRow {
  product_name_normalized: string;
  seller: string;
  product_code: string | null;
  product_name: string | null;
  currency_code: string | null;
  current_price: number | null;
  reference_price: number | null;
  source_url: string | null;
  changed_at: string | null;
}

export interface RecentDiscountsResponse {
  rows: RecentDiscountRow[];
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
