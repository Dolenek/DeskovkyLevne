const normalizePath = (value?: string | null): string => {
  if (!value) {
    return "/";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const prefixed = value.startsWith("/") ? value : `/${value}`;
  const trimmed = prefixed.replace(/\/$/, "");
  return trimmed || "/";
};

const resolveOrigin = (): string | null => {
  const envOrigin = import.meta.env.VITE_SITE_URL as string | undefined;
  if (envOrigin && /^https?:\/\//i.test(envOrigin)) {
    return envOrigin.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return null;
};

export const buildAbsoluteUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const origin = resolveOrigin();
  const normalized = normalizePath(value);
  if (!origin || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  return `${origin}${normalized}`;
};
