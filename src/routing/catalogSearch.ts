import { normalizeSearchTerm } from "../services/api/helpers";

export const catalogSearchQuery = (value: string): string => {
  const query = value.trim().slice(0, 120);
  return normalizeSearchTerm(query) ? query : "";
};

export const buildCatalogSearchPath = (value: string): string => {
  const query = catalogSearchQuery(value);
  return query ? `/deskove-hry?${new URLSearchParams({ q: query })}` : "/deskove-hry";
};
