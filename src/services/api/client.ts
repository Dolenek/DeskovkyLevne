import { API_PREFIX, API_RETRY_ATTEMPTS, API_RETRY_DELAY_MS } from "./config";

export interface ApiRequestOptions {
  signal?: AbortSignal;
}

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`API request failed (${status})`);
    this.status = status;
  }
}

const shouldRetryStatus = (status: number) => status === 429 || status >= 500;

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const waitForRetry = async (attempt: number, signal?: AbortSignal) => {
  const delayMs = API_RETRY_DELAY_MS * attempt;
  if (delayMs <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancelTimer);
      resolve();
    }, delayMs);

    function cancelTimer() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancelTimer);
      reject(new DOMException("The operation was aborted.", "AbortError"));
    }

    if (!signal) {
      return;
    }
    if (signal.aborted) {
      cancelTimer();
      return;
    }
    signal.addEventListener("abort", cancelTimer, { once: true });
  });
};

export const buildApiUrl = (
  path: string,
  params?: Record<string, string | number | null | undefined>
) => {
  const baseOrigin =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(`${API_PREFIX}${path}`, baseOrigin);
  if (!params) {
    return url.toString();
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const fetchJsonResponse = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new ApiRequestError(response.status);
  }
  return (await response.json()) as T;
};

const canRetryError = (error: unknown): boolean =>
  !isAbortError(error) &&
  (!(error instanceof ApiRequestError) || shouldRetryStatus(error.status));

export const fetchApi = async <T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { signal } = options;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < API_RETRY_ATTEMPTS) {
    attempt += 1;
    try {
      return await fetchJsonResponse<T>(url, signal);
    } catch (error) {
      lastError = error;
      if (!canRetryError(error)) {
        throw error;
      }
      if (attempt >= API_RETRY_ATTEMPTS) {
        break;
      }
      await waitForRetry(attempt, signal);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("API request failed");
};
