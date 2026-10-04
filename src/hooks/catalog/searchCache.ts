import type { AvailabilityFilter } from "../../types/filters";
import type { ProductSearchResult } from "../../types/product";
import { searchCatalogIndexByName } from "../../services/api/catalogApi";

type CacheEntry = { results: ProductSearchResult[]; timestamp: number };
export type SearchCache = Map<string, CacheEntry>;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

const cacheResults = (cache: SearchCache, key: string, results: ProductSearchResult[]) => {
  cache.delete(key);
  cache.set(key, { results, timestamp: Date.now() });
  if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
};

export const loadSearchResults = async (
  cache: SearchCache, query: string, availability: AvailabilityFilter,
  limit: number | undefined, signal: AbortSignal, force: boolean,
): Promise<ProductSearchResult[]> => {
  if (query.length < 2) return [];
  const key = JSON.stringify([availability, query.toLowerCase(), limit]);
  const cached = cache.get(key);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.results;
  const results = await searchCatalogIndexByName(query, limit, availability, signal);
  if (!signal.aborted) cacheResults(cache, key, results);
  return results;
};
