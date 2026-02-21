import type {
  CategoryCountRow,
  PriceRangeResponse,
  ProductSearchResult,
} from "../../types/product";
import type { AvailabilityFilter } from "../../types/filters";
import { buildSearchResultFromCatalogRow } from "../../utils/catalogTransforms";
import { buildApiUrl, fetchApi } from "./client";
import { SEARCH_LIMIT } from "./config";
import { filterRowsByCode, normalizeSearchTerm, sanitizeSearchTerm } from "./helpers";
import type {
  CatalogFilterOptions,
  CatalogResponse,
  CategoriesResponse,
  FilteredCatalogResult,
  SearchResponse,
} from "./types";

export const searchCatalogIndexByName = async (
  term: string,
  limit = SEARCH_LIMIT,
  availabilityFilter: AvailabilityFilter = "all",
  signal?: AbortSignal
): Promise<ProductSearchResult[]> => {
  const safeTerm = sanitizeSearchTerm(term);
  if (!safeTerm) {
    return [];
  }

  const normalizedTerm = normalizeSearchTerm(safeTerm);
  if (!normalizedTerm || normalizedTerm.length < 2) {
    return [];
  }

  const payload = await fetchApi<SearchResponse>(
    buildApiUrl("/search/suggest", {
      q: normalizedTerm,
      limit,
      availability: availabilityFilter === "all" ? null : availabilityFilter,
    }),
    { signal }
  );
  return filterRowsByCode(payload.rows).map((row) =>
    buildSearchResultFromCatalogRow(row)
  );
};

export const fetchFilteredCatalogIndex = async (
  from: number,
  size: number,
  filters: CatalogFilterOptions,
  signal?: AbortSignal
): Promise<FilteredCatalogResult> => {
  if (size <= 0) {
    return { rows: [], total: 0 };
  }

  const categories = (filters.categories ?? []).filter(Boolean).join(",");
  const payload = await fetchApi<CatalogResponse>(
    buildApiUrl("/catalog", {
      offset: Math.max(0, from),
      limit: size,
      availability: filters.availability === "all" ? null : filters.availability,
      min_price: filters.minPrice ?? null,
      max_price: filters.maxPrice ?? null,
      categories: categories || null,
    }),
    { signal }
  );

  return {
    rows: filterRowsByCode(payload.rows),
    total: payload.total ?? payload.total_estimate ?? 0,
  };
};

export const fetchCategoryCounts = async (
  availabilityFilter: AvailabilityFilter = "all",
  signal?: AbortSignal
): Promise<CategoryCountRow[]> => {
  const payload = await fetchApi<CategoriesResponse>(
    buildApiUrl("/meta/categories", {
      availability: availabilityFilter === "all" ? null : availabilityFilter,
    }),
    { signal }
  );
  return payload.rows;
};

export const fetchCatalogPriceRange = async (
  availabilityFilter: AvailabilityFilter,
  categoryFilters: string[],
  signal?: AbortSignal
): Promise<PriceRangeResponse> => {
  const categories = categoryFilters.filter(Boolean).join(",");
  return fetchApi<PriceRangeResponse>(
    buildApiUrl("/meta/price-range", {
      availability: availabilityFilter === "all" ? null : availabilityFilter,
      categories: categories || null,
    }),
    { signal }
  );
};
