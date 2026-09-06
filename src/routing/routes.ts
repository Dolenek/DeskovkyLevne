import { catalogSearchQuery } from "./catalogSearch";

const LANDING_LEVNE_PATH = "/levne-deskovky";
const CATALOG_PATH = "/deskove-hry";
const DETAIL_ROUTE = /^\/deskove-hry\/([^/]+)\/?$/i;

export type AppRoute =
  | { kind: "home" }
  | { kind: "landing-levne" }
  | { kind: "catalog"; query: string }
  | { kind: "detail"; slug: string }
  | { kind: "not-found"; path: string };

export const buildProductDetailPath = (slug: string) =>
  `/deskove-hry/${encodeURIComponent(slug)}`;

export const parseRoute = (location: string): AppRoute => {
  const [pathname, search = ""] = location.split(/\?(.*)/s);
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") {
    return { kind: "home" };
  }
  if (path === LANDING_LEVNE_PATH) {
    return { kind: "landing-levne" };
  }
  if (path === CATALOG_PATH) {
    return { kind: "catalog", query: catalogSearchQuery(new URLSearchParams(search).get("q") ?? "") };
  }
  const detailMatch = path.match(DETAIL_ROUTE);
  if (detailMatch?.[1]) {
    try {
      return { kind: "detail", slug: decodeURIComponent(detailMatch[1]) };
    } catch {
      return { kind: "not-found", path };
    }
  }
  return { kind: "not-found", path };
};
