import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductFetcher, ProductSeries } from "../types/product";
import { buildProductSeries } from "../utils/productTransforms";

interface UseProductPricingResult {
  series: ProductSeries[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  lastUpdatedAt: string | null;
}

const useProductSeriesLoader = (loader: ProductFetcher) => {
  const [series, setSeries] = useState<ProductSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRequestId = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    activeController.current?.abort();
    const controller = new AbortController();
    const requestId = activeRequestId.current + 1;
    activeController.current = controller;
    activeRequestId.current = requestId;
    setLoading(true);
    setSeries([]);
    setError(null);
    try {
      const rows = await loader(controller.signal);
      if (controller.signal.aborted || activeRequestId.current !== requestId) return;
      setSeries(buildProductSeries(rows));
    } catch (requestError) {
      if (controller.signal.aborted || activeRequestId.current !== requestId) return;
      setError(requestError instanceof Error ? requestError.message : "Unknown error");
    } finally {
      if (activeRequestId.current === requestId) setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void reload();
    return () => activeController.current?.abort();
  }, [reload]);

  return { series, loading, error, reload };
};

export const useProductPricing = (
  loader: ProductFetcher
): UseProductPricingResult => {
  const requestState = useProductSeriesLoader(loader);
  const lastUpdatedAt = useMemo(() => {
    return requestState.series.reduce<string | null>((latest, current) => {
      if (!current.latestScrapedAt) return latest;
      if (!latest || current.latestScrapedAt > latest) return current.latestScrapedAt;
      return latest;
    }, null);
  }, [requestState.series]);

  return { ...requestState, lastUpdatedAt };
};

