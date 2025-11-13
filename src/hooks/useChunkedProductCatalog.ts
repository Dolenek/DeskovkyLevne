import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProductRowsChunk } from "../services/productService";
import type { ProductRow, ProductSeries } from "../types/product";
import { buildProductSeries } from "../utils/productTransforms";

const DEFAULT_CHUNK_SIZE = Number(
  import.meta.env.VITE_SUPABASE_CATALOG_CHUNK ?? "1500"
);

interface UseChunkedProductCatalogOptions {
  chunkSize?: number;
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
  const chunkSize = Math.max(100, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const series = useMemo<ProductSeries[]>(() => buildProductSeries(rows), [rows]);

  const loadNextChunk = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const chunk = await fetchProductRowsChunk(cursor, chunkSize);
      setRows((previous) => [...previous, ...chunk]);
      setCursor((current) => current + chunkSize);
      if (chunk.length < chunkSize) {
        setHasMore(false);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, chunkSize, hasMore, loadingMore]);

  useEffect(() => {
    if (loading) {
      void loadNextChunk();
    }
  }, [loading, loadNextChunk]);

  const ensureCount = useCallback(
    async (count: number) => {
      if (series.length >= count || !hasMore) {
        return;
      }
      await loadNextChunk();
    },
    [series.length, hasMore, loadNextChunk]
  );

  const reload = useCallback(() => {
    setRows([]);
    setCursor(0);
    setHasMore(true);
    setError(null);
    setLoading(true);
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
