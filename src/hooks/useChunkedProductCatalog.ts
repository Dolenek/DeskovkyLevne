import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCatalogIndexChunk } from "../services/productService";
import type { ProductSeries } from "../types/product";
import { buildSeriesFromCatalogIndexRow } from "../utils/productTransforms";

const DEFAULT_INITIAL_CHUNK = Number(
  import.meta.env.VITE_SUPABASE_INITIAL_CHUNK ?? "400"
);
const DEFAULT_CHUNK_SIZE = Number(
  import.meta.env.VITE_SUPABASE_CATALOG_CHUNK ?? "2000"
);
const DEFAULT_PREFETCH_DELAY = Number(
  import.meta.env.VITE_SUPABASE_CATALOG_PREFETCH_DELAY ?? "150"
);

interface UseChunkedProductCatalogOptions {
  initialChunkSize?: number;
  chunkSize?: number;
  autoPrefetch?: boolean;
  prefetchDelayMs?: number;
}

interface ChunkedProductCatalogResult {
  series: ProductSeries[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  ensureCount: (count: number) => Promise<void>;
  reload: () => void;
}

export const useChunkedProductCatalog = (
  options: UseChunkedProductCatalogOptions = {}
): ChunkedProductCatalogResult => {
  const initialChunkSize = Math.max(
    100,
    options.initialChunkSize ?? DEFAULT_INITIAL_CHUNK
  );
  const chunkSize = Math.max(200, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const autoPrefetch = options.autoPrefetch ?? true;
  const prefetchDelay = Math.max(
    0,
    options.prefetchDelayMs ?? DEFAULT_PREFETCH_DELAY
  );

  const [series, setSeries] = useState<ProductSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef(0);
  const totalRef = useRef<number | null>(null);
  const initialLoadRef = useRef(true);
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    destroyedRef.current = false;
    return () => {
      destroyedRef.current = true;
      if (prefetchTimeoutRef.current !== null) {
        clearTimeout(prefetchTimeoutRef.current);
        prefetchTimeoutRef.current = null;
      }
    };
  }, []);

  const loadNextChunk = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return false;
    }
    const size = initialLoadRef.current ? initialChunkSize : chunkSize;
    initialLoadRef.current = false;
    setLoadingMore(true);
    try {
      const { rows, total } = await fetchCatalogIndexChunk(
        cursorRef.current,
        size
      );
      cursorRef.current += rows.length;
      if (rows.length < size) {
        setHasMore(false);
      }
      if (typeof total === "number") {
        totalRef.current = total;
      }
      setSeries((current) => {
        const map = new Map(current.map((item) => [item.productCode, item]));
        rows.forEach((row) => {
          map.set(row.product_code, buildSeriesFromCatalogIndexRow(row));
        });
        return Array.from(map.values()).sort((a, b) =>
          a.productCode.localeCompare(b.productCode, "cs")
        );
      });
      setError(null);
      return rows.length === size;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasMore(false);
      return false;
    } finally {
      if (!destroyedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [chunkSize, hasMore, initialChunkSize, loadingMore]);

  useEffect(() => {
    if (loading) {
      void loadNextChunk();
    }
  }, [loadNextChunk, loading]);

  useEffect(() => {
    if (!autoPrefetch || loading || !hasMore) {
      return;
    }
    if (prefetchTimeoutRef.current !== null) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    prefetchTimeoutRef.current = setTimeout(() => {
      void loadNextChunk();
    }, prefetchDelay);
    return () => {
      if (prefetchTimeoutRef.current !== null) {
        clearTimeout(prefetchTimeoutRef.current);
        prefetchTimeoutRef.current = null;
      }
    };
  }, [autoPrefetch, hasMore, loadNextChunk, loading, prefetchDelay, series.length]);

  const ensureCount = useCallback(
    async (count: number) => {
      if (series.length >= count || !hasMore) {
        return;
      }
      void loadNextChunk();
    },
    [hasMore, loadNextChunk, series.length]
  );

  const reload = useCallback(() => {
    if (prefetchTimeoutRef.current !== null) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
    cursorRef.current = 0;
    initialLoadRef.current = true;
    setSeries([]);
    setHasMore(true);
    setError(null);
    setLoading(true);
    setLoadingMore(false);
  }, []);

  return {
    series,
    loading,
    loadingMore,
    error,
    hasMore,
    ensureCount,
    reload,
  };
};
