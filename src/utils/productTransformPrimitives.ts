import type { ProductRow } from "../types/product";

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

export const toOptionalText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const toNumericPrice = (price: unknown): number | null => {
  const numeric = typeof price === "number" ? price : Number(price);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
};

export const normalizeGalleryArray = (
  value: ProductRow["gallery_image_urls"]
): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
    );
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (entry): entry is string =>
            typeof entry === "string" && entry.trim().length > 0
        );
      }
    } catch {
      // fall through to delimiter-based parsing
    }
    return value
      .split(/[\n,;]/g)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};
