import { expect, it, vi } from "vitest";
import { searchCatalogIndexByName } from "../../src/services/api/catalogApi";
import { loadSearchResults, type SearchCache } from "../../src/hooks/catalog/searchCache";

vi.mock("../../src/services/api/catalogApi", () => ({ searchCatalogIndexByName: vi.fn() }));
const search = vi.mocked(searchCatalogIndexByName);
const result = { slug: "game", label: "Game", primaryProductCode: null, categoryTags: [], latestPrice: 1 };
const load = (cache: SearchCache, limit = 10, force = false, signal = new AbortController().signal) =>
  loadSearchResults(cache, "game", "all", limit, signal, force);

it("caches only successful requests and retries after failure", async () => {
  const cache: SearchCache = new Map();
  search.mockRejectedValueOnce(new Error("unavailable")).mockResolvedValueOnce([result]);
  await expect(load(cache)).rejects.toThrow("unavailable");
  expect(cache.size).toBe(0);
  await expect(load(cache)).resolves.toEqual([result]);
  await expect(load(cache)).resolves.toEqual([result]);
  expect(search).toHaveBeenCalledTimes(2);
});

it("keeps cache entries separate by limit and bypasses cache on explicit retry", async () => {
  const cache: SearchCache = new Map();
  search.mockResolvedValue([result]);
  await load(cache, 10);
  await load(cache, 20);
  await load(cache, 10, true);
  expect(search).toHaveBeenCalledTimes(3);
});

it("does not cache a result completed after cancellation", async () => {
  const cache: SearchCache = new Map();
  const controller = new AbortController();
  search.mockImplementationOnce(async () => { controller.abort(); return [result]; });
  await load(cache, 10, false, controller.signal);
  expect(cache.size).toBe(0);
});

it("does not query the API for blank or single-character input", async () => {
  const cache: SearchCache = new Map();
  for (const query of ["", "a"]) {
    await expect(loadSearchResults(cache, query, "all", 10, new AbortController().signal, false))
      .resolves.toEqual([]);
  }
  expect(search).not.toHaveBeenCalled();
});
