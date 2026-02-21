const readNumber = (rawValue: string | undefined, fallback: number): number => {
  const parsed = Number(rawValue ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCodeAllowlist = (rawValue?: string) =>
  rawValue
    ? String(rawValue)
        .split(",")
        .map((code) => code.trim())
        .filter(Boolean)
    : [];

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

export const API_PREFIX = `${API_BASE_URL}/api/v1`;

export const API_RETRY_ATTEMPTS = Math.max(
  1,
  readNumber(import.meta.env.VITE_API_RETRY_ATTEMPTS, 2)
);

export const API_RETRY_DELAY_MS = Math.max(
  0,
  readNumber(import.meta.env.VITE_API_RETRY_DELAY_MS, 250)
);

export const FILTER_CODES = parseCodeAllowlist(
  import.meta.env.VITE_API_FILTER_CODES ??
    import.meta.env.VITE_SUPABASE_FILTER_CODES
);

export const SEARCH_LIMIT = readNumber(
  import.meta.env.VITE_API_SEARCH_LIMIT ??
    import.meta.env.VITE_SUPABASE_SEARCH_LIMIT,
  60
);

export const RECENT_LOOKBACK_LIMIT = readNumber(
  import.meta.env.VITE_API_RECENT_LOOKBACK ??
    import.meta.env.VITE_RECENT_DISCOUNT_LOOKBACK,
  2000
);

export const PRODUCT_HISTORY_POINTS = Math.max(
  0,
  readNumber(import.meta.env.VITE_API_PRODUCT_HISTORY_POINTS, 0)
);
