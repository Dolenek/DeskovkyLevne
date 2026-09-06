import { afterEach, expect, test, vi } from "vitest";
import { buildCatalogSearchPath } from "../../src/routing/catalogSearch";
import { parseRoute } from "../../src/routing/routes";
import { fetchFilteredCatalogIndex } from "../../src/services/api/catalogApi";

afterEach(() => vi.unstubAllGlobals());

test("search URLs preserve readable Czech text, delimiters and the 120 character limit", () => {
  const query = "Žlutá hra / 2?";
  const path = buildCatalogSearchPath(`  ${query}  `);
  expect(parseRoute(path)).toEqual({ kind: "catalog", query });
  expect(parseRoute(buildCatalogSearchPath("a".repeat(121)))).toEqual({
    kind: "catalog", query: "a".repeat(120),
  });
  expect(parseRoute("/deskove-hry/?q=%C4%8Desk%C3%A1+hra")).toEqual({
    kind: "catalog", query: "česká hra",
  });
  expect(parseRoute("/deskove-hry?q=hra?2")).toEqual({ kind: "catalog", query: "hra?2" });
});

test("empty and punctuation-only searches open the catalog", () => {
  for (const query of ["", "   ", "?! / …"]) {
    expect(buildCatalogSearchPath(query)).toBe("/deskove-hry");
  }
  expect(parseRoute("/deskove-hry?q=%21%3F")).toEqual({ kind: "catalog", query: "" });
  expect(parseRoute("/deskove-hry/alpha-game?ref=search")).toEqual({ kind: "detail", slug: "alpha-game" });
  expect(parseRoute("/unknown?q=game").kind).toBe("not-found");
});

test("catalog sends normalized query alongside pagination and filters", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ rows: [], total: 75 })));
  vi.stubGlobal("fetch", fetchMock);
  const result = await fetchFilteredCatalogIndex(10, 10, {
    query: "Žlutá: hra / 2?", categories: ["strategicka"], availability: "all",
  });
  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.pathname).toBe("/api/v1/catalog");
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    q: "zluta hra 2", offset: "10", limit: "10", categories: "strategicka",
  });
  expect(url.searchParams.has("min_price")).toBe(false);
  expect(url.searchParams.has("max_price")).toBe(false);
  expect(result.total).toBe(75);
});
