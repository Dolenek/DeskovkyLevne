const normalizePath = (value?: string | null): string => {
  if (!value) {
    return "/";
  }
  const prefixed = value.startsWith("/") ? value : `/${value}`;
  const trimmed = prefixed.replace(/\/$/, "");
  return trimmed || "/";
};

const containsUnsafeUrlCharacters = (value: string): boolean =>
  [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 || character === "\\";
  });

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const sanitizeExternalHttpsUrl = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed || containsUnsafeUrlCharacters(trimmed)) {
    return null;
  }
  const parsed = parseUrl(trimmed);
  if (
    !parsed ||
    parsed.protocol !== "https:" ||
    parsed.username.length > 0 ||
    parsed.password.length > 0
  ) {
    return null;
  }
  return trimmed;
};

const sanitizeLocalPath = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (
    !trimmed ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    containsUnsafeUrlCharacters(trimmed)
  ) {
    return null;
  }
  return trimmed;
};

export const sanitizeImageUrl = (value?: string | null): string | null =>
  sanitizeExternalHttpsUrl(value) ?? sanitizeLocalPath(value);

const sanitizeSiteOrigin = (value?: string | null): string | null => {
  const parsed = value ? parseUrl(value) : null;
  if (!parsed || parsed.username || parsed.password) {
    return null;
  }
  const loopbackHost = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopbackHost)) {
    return null;
  }
  return parsed.origin;
};

const resolveOrigin = (): string | null => {
  const envOrigin = import.meta.env.VITE_SITE_URL as string | undefined;
  const safeEnvOrigin = sanitizeSiteOrigin(envOrigin);
  if (safeEnvOrigin) {
    return safeEnvOrigin;
  }
  if (typeof window !== "undefined") {
    return sanitizeSiteOrigin(window.location.origin);
  }
  return null;
};

export const buildAbsoluteUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) {
    return sanitizeExternalHttpsUrl(value);
  }
  const origin = resolveOrigin();
  const normalized = sanitizeLocalPath(normalizePath(value));
  if (!normalized) {
    return null;
  }
  if (!origin) {
    return normalized;
  }
  return `${origin}${normalized}`;
};
