import { useMemo } from "react";
import { fetchProductSnapshotsBySlug } from "../services/productService";
import type { ProductSeries } from "../types/product";
import { useProductPricing } from "./useProductPricing";

interface UseProductDetailResult {
  product: ProductSeries | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useProductDetail = (
  productSlug: string
): UseProductDetailResult => {
  const loader = useMemo(() => {
    const trimmed = productSlug.trim();
    if (!trimmed) {
      return async () => [];
    }
    return () => fetchProductSnapshotsBySlug(trimmed);
  }, [productSlug]);

  const { series, loading, error, reload } = useProductPricing(loader);

  return {
    product: series[0] ?? null,
    loading,
    error,
    reload,
  };
};
