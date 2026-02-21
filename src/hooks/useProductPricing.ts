import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProductRows } from "../services/api/snapshotApi";
import type { ProductFetcher, ProductSeries } from "../types/product";
import { buildProductSeries } from "../utils/productTransforms";

interface UseProductPricingResult {
  series: ProductSeries[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  lastUpdatedAt: string | null;
}

export const useProductPricing = (
  loader: ProductFetcher = fetchProductRows
): UseProductPricingResult => {
  const [series, setSeries] = useState<ProductSeries[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await loader();
      setSeries(buildProductSeries(rows));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const lastUpdatedAt = useMemo(() => {
    return series.reduce<string | null>((latest, current) => {
      if (!current.latestScrapedAt) {
        return latest;
      }
      if (!latest || current.latestScrapedAt > latest) {
        return current.latestScrapedAt;
      }
      return latest;
    }, null);
  }, [series]);

  return { series, loading, error, reload, lastUpdatedAt };
};
