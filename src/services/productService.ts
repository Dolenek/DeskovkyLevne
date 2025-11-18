import { getSupabaseClient } from "../lib/supabaseClient";
import type {
  ProductCatalogIndexRow,
  ProductFetcher,
  ProductRow,
} from "../types/product";
import type { AvailabilityFilter } from "../types/filters";

const TABLE_NAME =
  import.meta.env.VITE_SUPABASE_PRODUCTS_TABLE ?? "product_price_snapshots";

const FILTER_CODES = import.meta.env.VITE_SUPABASE_FILTER_CODES
  ? String(import.meta.env.VITE_SUPABASE_FILTER_CODES)
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean)
  : [];

const SELECT_COLUMNS =
  "id, product_code, product_name_original, product_name_normalized, price_with_vat, list_price_with_vat, currency_code, source_url, scraped_at, availability_label, stock_status_label, hero_image_url, gallery_image_urls, short_description, supplementary_parameters, metadata, seller";
const CATALOG_INDEX_TABLE = "product_catalog_index";
const CATALOG_INDEX_COLUMNS =
  "product_code, product_name, currency_code, availability_label, stock_status_label, latest_price, previous_price, first_price, list_price_with_vat, source_url, latest_scraped_at, hero_image_url, gallery_image_urls, short_description, supplementary_parameters, metadata, price_points";

const SEARCH_LIMIT = Number(
  import.meta.env.VITE_SUPABASE_SEARCH_LIMIT ?? "2000"
);
const RECENT_LOOKBACK_LIMIT = Number(
  import.meta.env.VITE_RECENT_DISCOUNT_LOOKBACK ?? "2000"
);

type SelectOptions = {
  head?: boolean;
  count?: "exact" | "planned" | "estimated";
  distinct?: string;
};

const buildBaseQuery = (selectOptions?: SelectOptions) => {
  const supabase = getSupabaseClient();
  let query = supabase.from(TABLE_NAME).select(SELECT_COLUMNS, selectOptions);
  if (FILTER_CODES.length > 0) {
    query = query.in("product_code", FILTER_CODES);
  }
  return query;
};

const runQuery = async (query: any): Promise<ProductRow[]> => {
  const { data, error } = (await query) as {
    data: ProductRow[] | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

const buildCatalogIndexQuery = (selectOptions?: { count?: "exact" }) => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from(CATALOG_INDEX_TABLE)
    .select(CATALOG_INDEX_COLUMNS, selectOptions);
  if (FILTER_CODES.length > 0) {
    query = query.in("product_code", FILTER_CODES);
  }
  return query;
};

export const fetchProductRows: ProductFetcher = async () =>
  runQuery(buildBaseQuery().order("scraped_at", { ascending: true }));

export const fetchProductSnapshotsBySlug = async (
  productSlug: string
): Promise<ProductRow[]> => {
  const normalized = productSlug.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  return runQuery(
    buildBaseQuery()
      .eq("product_name_normalized", normalized)
      .order("scraped_at", { ascending: true })
  );
};

export const fetchRecentSnapshots = async (
  limit = RECENT_LOOKBACK_LIMIT
): Promise<ProductRow[]> =>
  runQuery(
    buildBaseQuery()
      .order("scraped_at", { ascending: false })
      .limit(limit)
  );

const sanitizeSearchTerm = (term: string) => term.replace(/[,*]/g, " ").trim();

export const searchSnapshotsByName = async (
  term: string,
  limit = SEARCH_LIMIT,
  availabilityFilter: AvailabilityFilter = "all"
): Promise<ProductRow[]> => {
  const safeTerm = sanitizeSearchTerm(term);
  if (!safeTerm) {
    return [];
  }

  const pattern = `%${safeTerm}%`;
  let query = buildBaseQuery().or(
    `product_name_original.ilike.${pattern},product_name_normalized.ilike.${pattern},product_code.ilike.${pattern}`
  );
  if (availabilityFilter === "available") {
    query = query.ilike("availability_label", "%Skladem%");
  } else if (availabilityFilter === "preorder") {
    query = query.ilike("availability_label", "%Předprodej%");
  }
  return runQuery(
    query.order("scraped_at", { ascending: true }).limit(limit)
  );
};

export const fetchProductRowsChunk = async (
  from: number,
  size: number
): Promise<ProductRow[]> => {
  if (size <= 0) {
    return [];
  }
  const start = Math.max(0, from);
  const end = start + size - 1;
  return runQuery(
    buildBaseQuery()
      .order("scraped_at", { ascending: false })
      .order("product_name_normalized", { ascending: true })
      .range(start, end)
  );
};

export const fetchUniqueProductRowsChunk = async (
  from: number,
  size: number
): Promise<ProductRow[]> => {
  if (size <= 0) {
    return [];
  }
  const start = Math.max(0, from);
  const end = start + size - 1;
  return runQuery(
    buildBaseQuery({ distinct: "product_name_normalized" })
      .order("product_name_normalized", { ascending: true })
      .order("scraped_at", { ascending: false })
      .range(start, end)
  );
};

export const fetchCatalogIndexChunk = async (
  from: number,
  size: number
): Promise<{ rows: ProductCatalogIndexRow[]; total: number | null }> => {
  if (size <= 0) {
    return { rows: [], total: null };
  }
  const start = Math.max(0, from);
  const end = start + size - 1;
  const { data, count, error } = (await buildCatalogIndexQuery({
    count: "exact",
  })
    .order("product_name", { ascending: true })
    .range(start, end)) as {
    data: ProductCatalogIndexRow[] | null;
    count: number | null;
    error: { message: string } | null;
  };
  if (error) {
    throw new Error(error.message);
  }
  return { rows: data ?? [], total: count };
};

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

const escapeIlikeValue = (value: string): string =>
  value.replace(/[%_]/g, (match) => `\\${match}`);

const applyAvailabilityFilter = (
  query: ReturnType<typeof buildCatalogIndexQuery>,
  availability?: AvailabilityFilter
) => {
  if (availability === "available") {
    return query.ilike("availability_label", "%Skladem%");
  }
  if (availability === "preorder") {
    return query.ilike("availability_label", "%Předprodej%");
  }
  return query;
};

const applyPriceFilter = (
  query: ReturnType<typeof buildCatalogIndexQuery>,
  minPrice?: number | null,
  maxPrice?: number | null
) => {
  let updated = query;
  if (minPrice !== null && minPrice !== undefined) {
    updated = updated.gte("latest_price", minPrice);
  }
  if (maxPrice !== null && maxPrice !== undefined) {
    updated = updated.lte("latest_price", maxPrice);
  }
  return updated;
};

const CATEGORY_JSON_PATH = "metadata->meta->>supplementaryParameters";

const applyCategoryFilter = (
  query: ReturnType<typeof buildCatalogIndexQuery>,
  categories?: string[]
) => {
  if (!categories?.length) {
    return query;
  }
  const clauses = categories
    .map((category) => category.trim())
    .filter((category) => category.length > 0)
    .map((category) => {
      const escaped = escapeIlikeValue(category);
      return `${CATEGORY_JSON_PATH}.ilike.%${escaped}%`;
    });
  if (clauses.length === 0) {
    return query;
  }
  return query.or(clauses.join(","));
};

export const fetchFilteredCatalogIndex = async (
  from: number,
  size: number,
  filters: CatalogFilterOptions
): Promise<FilteredCatalogResult> => {
  if (size <= 0) {
    return { rows: [], total: 0 };
  }
  const start = Math.max(0, from);
  const end = start + size - 1;

  let query = buildCatalogIndexQuery({ count: "exact" });
  query = applyAvailabilityFilter(query, filters.availability);
  query = applyPriceFilter(query, filters.minPrice, filters.maxPrice);
  query = applyCategoryFilter(query, filters.categories);

  const { data, count, error } = (await query
    .order("product_name", { ascending: true })
    .range(start, end)) as {
    data: ProductCatalogIndexRow[] | null;
    count: number | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: data ?? [],
    total: count ?? 0,
  };
};
