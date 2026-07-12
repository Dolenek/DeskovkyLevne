import { useCallback, useEffect, useState } from "react";
import { fetchRecentDiscounts } from "../services/api/snapshotApi";
import { RECENT_DISCOUNT_LIMIT } from "../services/api/config";
import type { DiscountEntry } from "../types/product";

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
		const discounts = await fetchRecentDiscounts(RECENT_DISCOUNT_LIMIT);
		setItems(discounts);
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
