const unsafeUrlCharacters = /[\u0000-\u001f\u007f\\]/;

export const sanitizeExternalHttpsUrl = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed || unsafeUrlCharacters.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
};

export const sanitizeImageUrl = (value) => {
  const externalUrl = sanitizeExternalHttpsUrl(value);
  if (externalUrl) {
    return externalUrl;
  }
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    unsafeUrlCharacters.test(trimmed)
  ) {
    return null;
  }
  return trimmed;
};

export const absoluteImageUrl = (siteUrl, value) => {
  const safeUrl = sanitizeImageUrl(value);
  if (!safeUrl || !safeUrl.startsWith("/")) {
    return safeUrl;
  }
  return `${siteUrl}${safeUrl}`;
};
