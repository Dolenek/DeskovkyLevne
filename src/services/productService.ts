import { getSupabaseClient } from "../lib/supabaseClient";
import type { ProductFetcher, ProductRow } from "../types/product";

const TABLE_NAME =
  import.meta.env.VITE_SUPABASE_PRODUCTS_TABLE ?? "product_price_snapshots";

const FILTER_CODES = import.meta.env.VITE_SUPABASE_FILTER_CODES
  ? String(import.meta.env.VITE_SUPABASE_FILTER_CODES)
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean)
  : [];

const SELECT_COLUMNS =
  "id, product_code, product_name, price_with_vat, list_price_with_vat, currency_code, source_url, scraped_at, availability_label, hero_image_url";

const SEARCH_LIMIT = Number(
  import.meta.env.VITE_SUPABASE_SEARCH_LIMIT ?? "2000"
);
const RECENT_LOOKBACK_LIMIT = Number(
  import.meta.env.VITE_RECENT_DISCOUNT_LOOKBACK ?? "2000"
);

const buildBaseQuery = () => {
  const supabase = getSupabaseClient();
  let query = supabase.from(TABLE_NAME).select(SELECT_COLUMNS);
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

export const fetchProductRows: ProductFetcher = async () =>
  runQuery(buildBaseQuery().order("scraped_at", { ascending: true }));

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
  onlyAvailable = false
): Promise<ProductRow[]> => {
  const safeTerm = sanitizeSearchTerm(term);
  if (!safeTerm) {
    return [];
  }

  const pattern = `%${safeTerm}%`;
  let query = buildBaseQuery().or(
    `product_name.ilike.${pattern},product_code.ilike.${pattern}`
  );
  if (onlyAvailable) {
    query = query.ilike("availability_label", "%Skladem%");
  }
  return runQuery(
    query.order("scraped_at", { ascending: true }).limit(limit)
  );
};
