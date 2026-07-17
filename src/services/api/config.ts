const readNumber = (rawValue: string | undefined, fallback: number): number => {
  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readInteger = (rawValue: string | undefined, fallback: number): number =>
  Math.trunc(readNumber(rawValue, fallback));

const parseCodeAllowlist = (rawValue?: string) =>
  rawValue
    ? String(rawValue)
        .split(",")
        .map((code) => code.trim())
        .filter(Boolean)
    : [];

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/+$/, "");

export const API_PREFIX = `${API_BASE_URL}/api/v1`;

export const API_RETRY_ATTEMPTS = Math.max(
	1,
	readInteger(import.meta.env.VITE_API_RETRY_ATTEMPTS, 2)
);

export const API_RETRY_DELAY_MS = Math.max(
  0,
  readNumber(import.meta.env.VITE_API_RETRY_DELAY_MS, 250)
);

export const FILTER_CODES = parseCodeAllowlist(
  import.meta.env.VITE_API_FILTER_CODES ??
    import.meta.env.VITE_SUPABASE_FILTER_CODES
);

export const SEARCH_LIMIT = Math.max(1, readInteger(
	import.meta.env.VITE_API_SEARCH_LIMIT ??
		import.meta.env.VITE_SUPABASE_SEARCH_LIMIT,
	60
));

export const PRODUCT_HISTORY_POINTS = Math.max(
  0,
	readInteger(import.meta.env.VITE_API_PRODUCT_HISTORY_POINTS, 0)
);
