import type { ProductRow, ProductSeries } from "../types/product";
import { toDateKey } from "./date";

interface SeriesDraft {
  productCode: string;
  label: string;
  currency?: string | null;
  url?: string | null;
  listPrice: number | null;
  heroImage?: string | null;
  availabilityLabel?: string | null;
  availabilityRecordedAt: number | null;
  shortDescription?: string | null;
  galleryImages?: string[];
  points: ProductSeries["points"];
}

const toTimestamp = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toSeriesLabel = (row: ProductRow): string =>
  row.product_name?.trim() || row.product_code;

const toOptionalText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNumericPrice = (price: unknown): number | null => {
  const numeric = typeof price === "number" ? price : Number(price);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
};

const appendPoint = (draft: SeriesDraft, row: ProductRow) => {
  const price = toNumericPrice(row.price_with_vat);
  if (price === null || !row.scraped_at) {
    return;
  }

  draft.points.push({
    rawDate: toDateKey(row.scraped_at),
    price,
  });
};

const normalizeGalleryArray = (
  value: ProductRow["gallery_image_urls"]
): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
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

const mergeGalleryImages = (draft: SeriesDraft, row: ProductRow): void => {
  const incoming = normalizeGalleryArray(row.gallery_image_urls);
  if (incoming.length === 0) {
    return;
  }
  const existing = draft.galleryImages ?? [];
  const merged = new Set(existing);
  incoming.forEach((url) => merged.add(url));
  draft.galleryImages = Array.from(merged);
};

const updateAvailabilityLabel = (draft: SeriesDraft, row: ProductRow): void => {
  const scrapedAt = toTimestamp(row.scraped_at);
  if (scrapedAt === null) {
    return;
  }
  if (
    draft.availabilityRecordedAt === null ||
    scrapedAt >= draft.availabilityRecordedAt
  ) {
    draft.availabilityLabel = row.availability_label ?? null;
    draft.availabilityRecordedAt = scrapedAt;
  }
};

export const buildProductSeries = (rows: ProductRow[]): ProductSeries[] => {
  const drafts = new Map<string, SeriesDraft>();

  rows.forEach((row) => {
    if (!row.product_code) {
      return;
    }
    if (!drafts.has(row.product_code)) {
      drafts.set(row.product_code, {
        productCode: row.product_code,
        label: toSeriesLabel(row),
        currency: row.currency_code ?? null,
        url: row.source_url ?? null,
        listPrice: toNumericPrice(row.list_price_with_vat),
        heroImage: row.hero_image_url ?? null,
        availabilityLabel: row.availability_label ?? null,
        availabilityRecordedAt: toTimestamp(row.scraped_at),
        shortDescription: toOptionalText(row.short_description),
        galleryImages: normalizeGalleryArray(row.gallery_image_urls),
        points: [],
      });
    }

    const draft = drafts.get(row.product_code)!;
    if (draft.listPrice === null && row.list_price_with_vat !== null) {
      draft.listPrice = toNumericPrice(row.list_price_with_vat);
    }
    if (!draft.heroImage && row.hero_image_url) {
      draft.heroImage = row.hero_image_url;
    }
    if (!draft.shortDescription && row.short_description) {
      draft.shortDescription = toOptionalText(row.short_description);
    }
    updateAvailabilityLabel(draft, row);
    mergeGalleryImages(draft, row);
    appendPoint(draft, row);
  });

  return Array.from(drafts.values())
    .map((draft) => {
      const { availabilityRecordedAt: _availabilityRecordedAt, ...seriesBase } = draft;
      const points = draft.points
        .sort(
          (a, b) =>
            new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
        )
        .filter(
          (point, index, arr) =>
            index === 0 || point.rawDate !== arr[index - 1]?.rawDate
        );
      const firstPrice = points[0]?.price ?? null;
      const latestPrice = points[points.length - 1]?.price ?? null;
      const previousPrice =
        points.length > 1 ? points[points.length - 2]?.price ?? null : null;
      const latestScrapedAt = points[points.length - 1]?.rawDate ?? null;

      return {
        ...seriesBase,
        points,
        firstPrice,
        latestPrice,
        previousPrice,
        latestScrapedAt,
      };
    })
    .filter((series) => series.points.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "cs"));
};
