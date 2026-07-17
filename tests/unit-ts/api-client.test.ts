import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("API client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_RETRY_ATTEMPTS", "2");
    vi.stubEnv("VITE_API_RETRY_DELAY_MS", "0");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test("buildApiUrl encodes values and omits empty parameters", async () => {
    const { buildApiUrl } = await import("../../src/services/api/client");

    const url = new URL(buildApiUrl("/products/fancy%2Fgame", {
      q: "česká hra",
      limit: 0,
      empty: "",
      absent: null,
      missing: undefined,
    }));

    expect(url.pathname).toBe("/api/v1/products/fancy%2Fgame");
    expect(url.searchParams.get("q")).toBe("česká hra");
    expect(url.searchParams.get("limit")).toBe("0");
    expect(url.searchParams.has("empty")).toBe(false);
    expect(url.searchParams.has("absent")).toBe(false);
    expect(url.searchParams.has("missing")).toBe(false);
  });

  test("retries HTTP 429 and 5xx responses", async () => {
    const { fetchApi } = await import("../../src/services/api/client");

    for (const status of [429, 503]) {
      fetchMock.mockReset();
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ error: "temporary" }, status))
        .mockResolvedValueOnce(jsonResponse({ status: "ok" }));

      await expect(fetchApi<{ status: string }>("https://api.test/value")).resolves.toEqual({
        status: "ok",
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    }
  });

  test("retries network and malformed JSON failures", async () => {
    const { fetchApi } = await import("../../src/services/api/client");

    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse({ attempt: 2 }));
    await expect(fetchApi<{ attempt: number }>("https://api.test/network")).resolves.toEqual({
      attempt: 2,
    });

    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(new Response("not-json", { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ attempt: 2 }));
    await expect(fetchApi<{ attempt: number }>("https://api.test/json")).resolves.toEqual({
      attempt: 2,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("does not retry ordinary client errors", async () => {
    const { ApiRequestError, fetchApi } = await import(
      "../../src/services/api/client"
    );
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid" }, 400));

    const request = fetchApi("https://api.test/invalid");
    await expect(request).rejects.toBeInstanceOf(ApiRequestError);
    await expect(request).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("aborts while waiting for a retry", async () => {
    vi.stubEnv("VITE_API_RETRY_DELAY_MS", "10000");
    vi.resetModules();
    const { fetchApi } = await import("../../src/services/api/client");
    fetchMock.mockResolvedValue(jsonResponse({ error: "temporary" }, 503));
    const controller = new AbortController();

    const request = fetchApi("https://api.test/slow", {
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
