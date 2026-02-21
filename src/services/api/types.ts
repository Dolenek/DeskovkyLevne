import type {
  CatalogSearchRow,
  CategoryCountRow,
  ProductCatalogIndexRow,
  ProductRow,
} from "../../types/product";
import type { AvailabilityFilter } from "../../types/filters";

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
  categories?: string[];
}

export interface FilteredCatalogResult {
  rows: ProductCatalogIndexRow[];
  total: number;
}
