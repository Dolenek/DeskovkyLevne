export const LANDING_LEVNE_PATH = "/levne-deskovky";
export const LANDING_DESKOVE_PATH = "/deskove-hry";
const DETAIL_ROUTE = /^\/deskove-hry\/([^/]+)\/?$/i;

export type AppRoute =
  | { kind: "home" }
  | { kind: "landing-levne" }
  | { kind: "landing-deskove" }
  | { kind: "detail"; slug: string }
  | { kind: "not-found"; path: string };

export const buildProductDetailPath = (slug: string) =>
  `/deskove-hry/${encodeURIComponent(slug)}`;

export const parseRoute = (path: string): AppRoute => {
  if (path === "/") {
    return { kind: "home" };
  }
  if (path === LANDING_LEVNE_PATH) {
    return { kind: "landing-levne" };
  }
  if (path === LANDING_DESKOVE_PATH) {
    return { kind: "landing-deskove" };
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
