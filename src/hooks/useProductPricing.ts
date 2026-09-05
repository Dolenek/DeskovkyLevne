import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductFetcher, ProductSeries } from "../types/product";
import { buildProductSeries } from "../utils/productSeries/buildProductSeries";

interface UseProductPricingResult extends ProductSeriesRequestState {
  reload: () => void;
}

interface ProductSeriesRequestState {
  series: ProductSeries[];
  loading: boolean;
  error: string | null;
}

const hideSeriesFromPreviousLoader = (
  loaderChanged: boolean,
  requestState: ProductSeriesRequestState
): ProductSeriesRequestState =>
  loaderChanged ? { series: [], loading: true, error: null } : requestState;

export const useProductPricing = (loader: ProductFetcher): UseProductPricingResult => {
  const [requestState, setRequestState] = useState<ProductSeriesRequestState>(
    { series: [], loading: true, error: null }
  );
  const activeRequestId = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const activeRequestLoader = useRef(loader);

  const reload = useCallback(async () => {
    activeRequestLoader.current = loader;
    activeController.current?.abort();
    const controller = new AbortController();
    const requestId = activeRequestId.current + 1;
    activeController.current = controller;
    activeRequestId.current = requestId;
    setRequestState({ series: [], loading: true, error: null });
    try {
      const rows = await loader(controller.signal);
      if (controller.signal.aborted || activeRequestId.current !== requestId) return;
      setRequestState({ series: buildProductSeries(rows), loading: false, error: null });
    } catch (requestError) {
      if (controller.signal.aborted || activeRequestId.current !== requestId) return;
      const error = requestError instanceof Error ? requestError.message : "Unknown error";
      setRequestState({ series: [], loading: false, error });
    }
  }, [loader]);

  useEffect(() => {
    void reload();
    return () => activeController.current?.abort();
  }, [reload]);

  return {
    ...hideSeriesFromPreviousLoader(activeRequestLoader.current !== loader, requestState),
    reload,
  };
};
