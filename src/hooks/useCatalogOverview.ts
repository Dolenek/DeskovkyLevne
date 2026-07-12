import { useEffect, useState } from "react";
import { fetchCatalogOverview } from "../services/api/catalogApi";
import type { CatalogOverviewResponse } from "../services/api/types";

export const useCatalogOverview = () => {
  const [catalogOverview, setCatalogOverview] =
    useState<CatalogOverviewResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadCatalogOverview = async () => {
      try {
        const latestOverview = await fetchCatalogOverview(controller.signal);
        if (!controller.signal.aborted) {
          setCatalogOverview(latestOverview);
        }
      } catch {
        if (!controller.signal.aborted) {
          setCatalogOverview(null);
        }
      }
    };

    void loadCatalogOverview();
    return () => controller.abort();
  }, []);

  return catalogOverview;
};
