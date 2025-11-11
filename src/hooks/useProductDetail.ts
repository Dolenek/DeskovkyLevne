import { useMemo } from "react";
import { fetchProductSnapshotsByCode } from "../services/productService";
import type { ProductSeries } from "../types/product";
import { useProductPricing } from "./useProductPricing";

interface UseProductDetailResult {
  product: ProductSeries | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useProductDetail = (
  productCode: string
): UseProductDetailResult => {
  const loader = useMemo(() => {
    const trimmed = productCode.trim();
    if (!trimmed) {
      return async () => [];
    }
    return () => fetchProductSnapshotsByCode(trimmed);
  }, [productCode]);

  const { series, loading, error, reload } = useProductPricing(loader);

  return {
    product: series[0] ?? null,
    loading,
    error,
    reload,
  };
};
