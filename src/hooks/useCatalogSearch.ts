import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AvailabilityFilter } from "../types/filters";
import type { ProductSearchResult } from "../types/product";
import { searchCatalogIndexByName } from "../services/productService";

const MIN_QUERY_LENGTH = 2;
const MAX_CACHE_ENTRIES = 50;
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { results: ProductSearchResult[]; timestamp: number };

type QueryState = {
  query: string;
  availability: AvailabilityFilter;
};

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, " ");

const createCacheKey = (query: string, availability: AvailabilityFilter) =>
  `${availability}:${query.toLowerCase()}`;

const isCacheFresh = (timestamp: number) =>
  Date.now() - timestamp < CACHE_TTL_MS;

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

const resetSearchState = (
  setResults: (results: ProductSearchResult[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  setResults([]);
  setLoading(false);
  setError(null);
};

const applyCachedResults = (
  cached: CacheEntry,
  setResults: (results: ProductSearchResult[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  setResults(cached.results);
  setLoading(false);
  setError(null);
};

const getNextRequestId = (requestRef: MutableRefObject<number>) => {
  const next = requestRef.current + 1;
  requestRef.current = next;
  return next;
};

const invalidateRequests = (requestRef: MutableRefObject<number>) => {
  requestRef.current += 1;
};

const fetchAndStoreResults = async ({
  query,
  availability,
  limit,
  requestId,
  requestRef,
  cacheKey,
  cacheRef,
  setResults,
  setError,
}: {
  query: string;
  availability: AvailabilityFilter;
  limit: number | undefined;
  requestId: number;
  requestRef: MutableRefObject<number>;
  cacheKey: string;
  cacheRef: MutableRefObject<Map<string, CacheEntry>>;
  setResults: (results: ProductSearchResult[]) => void;
  setError: (error: string | null) => void;
}) => {
  try {
    const fetched = await searchCatalogIndexByName(
      query,
      limit,
      availability
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
    if (requestRef.current !== requestId) {
      return;
    }
    setError(err instanceof Error ? err.message : "Unknown error");
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
  const lastQueryRef = useRef<QueryState>({
    query: "",
    availability: availabilityFilter,
  });

  const runSearch = useCallback(
    async ({ force }: { force?: boolean } = {}) => {
      const { query: activeQuery, availability } = lastQueryRef.current;
      if (activeQuery.length < MIN_QUERY_LENGTH) {
        invalidateRequests(requestRef);
        resetSearchState(setResults, setLoading, setError);
        return;
      }

      const cacheKey = createCacheKey(activeQuery, availability);
      const cached = cacheRef.current.get(cacheKey);
      const hasFreshCache = cached && isCacheFresh(cached.timestamp);
      if (!force && hasFreshCache && cached) {
        applyCachedResults(cached, setResults, setLoading, setError);
        return;
      }

      if (cached) {
        setResults(cached.results);
      }
      setLoading(true);
      const requestId = getNextRequestId(requestRef);
      await fetchAndStoreResults({
        query: activeQuery,
        availability,
        limit,
        requestId,
        requestRef,
        cacheKey,
        cacheRef,
        setResults,
        setError,
      });
      if (requestRef.current === requestId) {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    lastQueryRef.current = {
      query: normalizedQuery,
      availability: availabilityFilter,
    };
    void runSearch();
  }, [availabilityFilter, normalizedQuery, runSearch]);

  const reload = useCallback(() => {
    void runSearch({ force: true });
  }, [runSearch]);

  return { results, loading, error, reload };
};
