import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AvailabilityFilter } from "../types/filters";
import type { ProductSearchResult } from "../types/product";
import { searchCatalogIndexByName } from "../services/api/catalogApi";

const MIN_QUERY_LENGTH = 2;
const MAX_CACHE_ENTRIES = 50;
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { results: ProductSearchResult[]; timestamp: number };
type QueryState = { query: string; availability: AvailabilityFilter };

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, " ");
const createCacheKey = (query: string, availability: AvailabilityFilter) =>
  `${availability}:${query.toLowerCase()}`;
const isCacheFresh = (timestamp: number) => Date.now() - timestamp < CACHE_TTL_MS;
const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const setCacheEntry = (
  cache: Map<string, CacheEntry>,
  key: string,
  value: CacheEntry
) => {
  if (cache.has(key)) {
    cache.delete(key);
  }
  cache.set(key, value);
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
};

interface UseCatalogSearchOptions {
  query: string;
  availabilityFilter: AvailabilityFilter;
  limit?: number;
}

interface UseCatalogSearchResult {
  results: ProductSearchResult[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useCatalogSearch = ({
  query,
  availabilityFilter,
  limit,
}: UseCatalogSearchOptions): UseCatalogSearchResult => {
  const normalizedQuery = useMemo(() => normalizeQuery(query), [query]);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef(new Map<string, CacheEntry>());
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<QueryState>({
    query: "",
    availability: availabilityFilter,
  });

  const cancelActiveRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const runSearch = useCallback(
    async ({ force }: { force?: boolean } = {}) => {
      const { query: activeQuery, availability } = lastQueryRef.current;
      if (activeQuery.length < MIN_QUERY_LENGTH) {
        requestRef.current += 1;
        cancelActiveRequest();
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      const cacheKey = createCacheKey(activeQuery, availability);
      const cached = cacheRef.current.get(cacheKey);
      if (!force && cached && isCacheFresh(cached.timestamp)) {
        cancelActiveRequest();
        setResults(cached.results);
        setLoading(false);
        setError(null);
        return;
      }

      if (cached) {
        setResults(cached.results);
      }

      cancelActiveRequest();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      try {
        const fetched = await searchCatalogIndexByName(
          activeQuery,
          limit,
          availability,
          controller.signal
        );
        if (requestRef.current !== requestId) {
          return;
        }
        setResults(fetched);
        setError(null);
        setCacheEntry(cacheRef.current, cacheKey, {
          results: fetched,
          timestamp: Date.now(),
        });
      } catch (err) {
        if (requestRef.current !== requestId || isAbortError(err)) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false);
        }
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [cancelActiveRequest, limit]
  );

  useEffect(() => {
    lastQueryRef.current = {
      query: normalizedQuery,
      availability: availabilityFilter,
    };
    void runSearch();
  }, [availabilityFilter, normalizedQuery, runSearch]);

  useEffect(() => cancelActiveRequest, [cancelActiveRequest]);

  const reload = useCallback(() => {
    void runSearch({ force: true });
  }, [runSearch]);

  return { results, loading, error, reload };
};
