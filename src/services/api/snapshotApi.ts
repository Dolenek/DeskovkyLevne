import type { ProductFetcher, ProductRow } from "../../types/product";
import { buildApiUrl, fetchApi } from "./client";
import { filterRowsByCode } from "./helpers";
import {
  PRODUCT_HISTORY_POINTS,
  RECENT_LOOKBACK_LIMIT,
} from "./config";
import type { SnapshotResponse } from "./types";

export const fetchProductRows: ProductFetcher = async () =>
  fetchRecentSnapshots(RECENT_LOOKBACK_LIMIT);

export const fetchProductSnapshotsBySlug = async (
  productSlug: string,
  signal?: AbortSignal
): Promise<ProductRow[]> => {
  const normalizedSlug = productSlug.trim().toLowerCase();
  if (!normalizedSlug) {
    return [];
  }

  const payload = await fetchApi<SnapshotResponse>(
    buildApiUrl(`/products/${encodeURIComponent(normalizedSlug)}`, {
      history_points: PRODUCT_HISTORY_POINTS > 0 ? PRODUCT_HISTORY_POINTS : null,
    }),
    { signal }
  );
  return filterRowsByCode(payload.rows);
};

export const fetchRecentSnapshots = async (
  limit = RECENT_LOOKBACK_LIMIT,
  signal?: AbortSignal
): Promise<ProductRow[]> => {
  const payload = await fetchApi<SnapshotResponse>(
    buildApiUrl("/snapshots/recent", { limit }),
    { signal }
  );
  return filterRowsByCode(payload.rows);
};
