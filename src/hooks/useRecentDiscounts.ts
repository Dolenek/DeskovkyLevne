import { useCallback, useEffect, useState } from "react";
import { fetchRecentSnapshots } from "../services/productService";
import type { DiscountEntry } from "../types/product";
import { detectRecentDiscounts } from "../utils/discounts";

const RECENT_RESULT_LIMIT = Number(
  import.meta.env.VITE_RECENT_DISCOUNT_RESULTS ?? "10"
);
const RECENT_LOOKBACK_LIMIT = Number(
  import.meta.env.VITE_API_RECENT_LOOKBACK ??
    import.meta.env.VITE_RECENT_DISCOUNT_LOOKBACK ??
    "2000"
);

interface UseRecentDiscountsState {
  items: DiscountEntry[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useRecentDiscounts = (): UseRecentDiscountsState => {
  const [items, setItems] = useState<DiscountEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snapshots = await fetchRecentSnapshots(RECENT_LOOKBACK_LIMIT);
      const detected = detectRecentDiscounts(snapshots, RECENT_RESULT_LIMIT);
      setItems(detected);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
};
