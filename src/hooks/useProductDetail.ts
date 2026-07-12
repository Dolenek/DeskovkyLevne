import { useMemo } from "react";
import { buildMockProductRows } from "../mocks/mockProductRows";
import { fetchProductDetailBySlug } from "../services/api/snapshotApi";
import type { ProductSeries } from "../types/product";
import { isApiFallbackFailure } from "../utils/networkErrors";
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
    return async () => {
      try {
		return await fetchProductDetailBySlug(trimmed);
      } catch (error) {
        if (isApiFallbackFailure(error)) {
          return buildMockProductRows(trimmed);
        }
        throw error;
      }
    };
  }, [productSlug]);

  const { series, loading, error, reload } = useProductPricing(loader);

  return {
    product: series[0] ?? null,
    loading,
    error,
    reload,
  };
};
