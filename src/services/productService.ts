import type {
  CatalogSearchRow,
  CategoryCountRow,
  PriceRangeResponse,
  ProductCatalogIndexRow,
  ProductFetcher,
  ProductRow,
  ProductSearchResult,
} from "../types/product";
import type { AvailabilityFilter } from "../types/filters";
import { buildSearchResultFromCatalogRow } from "../utils/catalogTransforms";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");
const API_PREFIX = `${API_BASE_URL}/api/v1`;
const API_RETRY_ATTEMPTS = Math.max(
  1,
  Number(import.meta.env.VITE_API_RETRY_ATTEMPTS ?? "2")
);
const API_RETRY_DELAY_MS = Math.max(
  0,
  Number(import.meta.env.VITE_API_RETRY_DELAY_MS ?? "250")
);

const FILTER_CODES = import.meta.env.VITE_API_FILTER_CODES
  ? String(import.meta.env.VITE_API_FILTER_CODES)
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean)
  : import.meta.env.VITE_SUPABASE_FILTER_CODES
  ? String(import.meta.env.VITE_SUPABASE_FILTER_CODES)
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean)
  : [];

const SEARCH_LIMIT = Number(
  import.meta.env.VITE_API_SEARCH_LIMIT ??
    import.meta.env.VITE_SUPABASE_SEARCH_LIMIT ??
    "60"
);
const RECENT_LOOKBACK_LIMIT = Number(
  import.meta.env.VITE_API_RECENT_LOOKBACK ??
    import.meta.env.VITE_RECENT_DISCOUNT_LOOKBACK ??
    "2000"
);

interface CatalogResponse {
  rows: ProductCatalogIndexRow[];
  total: number;
  total_estimate?: number;
}

interface SearchResponse {
  rows: CatalogSearchRow[];
}

interface SnapshotResponse {
  rows: ProductRow[];
}

interface CategoriesResponse {
  rows: CategoryCountRow[];
}

interface CatalogFilterOptions {
  availability?: AvailabilityFilter;
  minPrice?: number | null;
  maxPrice?: number | null;
  categories?: string[];
}

interface FilteredCatalogResult {
  rows: ProductCatalogIndexRow[];
  total: number;
}

interface ApiRequestOptions {
  signal?: AbortSignal;
}

const buildApiUrl = (
  path: string,
  params?: Record<string, string | number | null | undefined>
) => {
  const url = new URL(`${API_PREFIX}${path}`);
  if (!params) {
    return url.toString();
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

class ApiRequestError extends Error {
  status: number;

  constructor(status: number) {
    super(`API request failed (${status})`);
    this.status = status;
  }
}

const shouldRetryStatus = (status: number) => status === 429 || status >= 500;

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const waitForRetry = async (attempt: number, signal?: AbortSignal) => {
  const delayMs = API_RETRY_DELAY_MS * attempt;
  if (delayMs <= 0) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const abortSignal = signal;
    const timer = setTimeout(() => {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", cancelTimer);
      }
      resolve();
    }, delayMs);
    if (!abortSignal) {
      return;
    }
    function cancelTimer() {
      clearTimeout(timer);
      abortSignal!.removeEventListener("abort", cancelTimer);
      reject(new DOMException("The operation was aborted.", "AbortError"));
    }
    if (abortSignal.aborted) {
      cancelTimer();
      return;
    }
    abortSignal.addEventListener("abort", cancelTimer, { once: true });
  });
};

const fetchApi = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { signal } = options;
  let attempt = 0;
  let lastError: unknown = null;
  while (attempt < API_RETRY_ATTEMPTS) {
    attempt += 1;
    try {
      const response = await fetch(path, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      });
      if (!response.ok) {
        const error = new ApiRequestError(response.status);
        if (
          attempt < API_RETRY_ATTEMPTS &&
          shouldRetryStatus(response.status)
        ) {
          await waitForRetry(attempt, signal);
          continue;
        }
        throw error;
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (isAbortError(error)) {
        throw error;
      }
      if (error instanceof ApiRequestError) {
        throw error;
      }
      if (attempt >= API_RETRY_ATTEMPTS) {
        break;
      }
      await waitForRetry(attempt, signal);
    }
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("API request failed");
};

const filterRowsByCode = <T extends { product_code?: string | null }>(
  rows: T[]
): T[] => {
  if (FILTER_CODES.length === 0) {
    return rows;
  }
  const allowed = new Set(FILTER_CODES);
  return rows.filter((row) => {
    if (!row.product_code) {
      return false;
    }
    return allowed.has(row.product_code);
  });
};

const sanitizeSearchTerm = (term: string) => term.replace(/[,*]/g, " ").trim();

const normalizeSearchTerm = (term: string) =>
  term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const fetchProductRows: ProductFetcher = async () =>
  fetchRecentSnapshots(RECENT_LOOKBACK_LIMIT);

export const fetchProductSnapshotsBySlug = async (
  productSlug: string,
  signal?: AbortSignal
): Promise<ProductRow[]> => {
  const normalized = productSlug.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  const payload = await fetchApi<SnapshotResponse>(
    buildApiUrl(`/products/${encodeURIComponent(normalized)}`),
    { signal }
  );
  return filterRowsByCode(payload.rows);
};

export const fetchRecentSnapshots = async (
  limit = RECENT_LOOKBACK_LIMIT,
  signal?: AbortSignal
): Promise<ProductRow[]> => {
  const payload = await fetchApi<SnapshotResponse>(
    buildApiUrl("/snapshots/recent", { limit }),
    { signal }
  );
  return filterRowsByCode(payload.rows);
};

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
  const normalized = normalizeSearchTerm(safeTerm);
  if (!normalized || normalized.length < 2) {
    return [];
  }
  const payload = await fetchApi<SearchResponse>(
    buildApiUrl("/search/suggest", {
      q: normalized,
      limit,
      availability: availabilityFilter === "all" ? null : availabilityFilter,
    }),
    { signal }
  );
  const filtered = filterRowsByCode(payload.rows);
  return filtered.map((row) => buildSearchResultFromCatalogRow(row));
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
