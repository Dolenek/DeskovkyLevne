export const DEFAULT_SITE_URL = "https://www.deskovkylevne.com";

const normalizeOrigin = (origin) => String(origin ?? "").trim().replace(/\/+$/, "");

export const rewritePrerenderOrigin = (html, sourceOrigin, targetOrigin) => {
  const normalizedSourceOrigin = normalizeOrigin(sourceOrigin);
  const normalizedTargetOrigin = normalizeOrigin(targetOrigin);
  if (
    !normalizedSourceOrigin ||
    !normalizedTargetOrigin ||
    normalizedSourceOrigin === normalizedTargetOrigin
  ) {
    return html;
  }

  return html.replaceAll(normalizedSourceOrigin, normalizedTargetOrigin);
};
