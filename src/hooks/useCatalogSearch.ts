import { useMemo, useRef } from "react";
import type { AvailabilityFilter } from "../types/filters";
import type { ProductSearchResult } from "../types/product";
import { loadSearchResults, type SearchCache } from "./catalog/searchCache";
import { useAsyncResource } from "./useAsyncResource";

interface UseCatalogSearchOptions {
  query: string;
  availabilityFilter: AvailabilityFilter;
  limit?: number;
}

const EMPTY_RESULTS: ProductSearchResult[] = [];

export const useCatalogSearch = ({ query, availabilityFilter, limit }: UseCatalogSearchOptions) => {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const cacheRef = useRef<SearchCache>(new Map());
  const loader = useMemo(() => (signal: AbortSignal, force: boolean) =>
    loadSearchResults(cacheRef.current, normalizedQuery, availabilityFilter, limit, signal, force),
  [availabilityFilter, limit, normalizedQuery]);
  const { value: results, loading, error, reload } = useAsyncResource(loader, EMPTY_RESULTS);
  return { results, loading, error, reload };
};
