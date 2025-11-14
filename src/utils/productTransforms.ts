import type {
  ProductCatalogIndexRow,
  ProductRow,
  ProductSeries,
  SupplementaryParameter,
} from "../types/product";
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
  supplementaryParameters: SupplementaryParameter[];
  supplementaryRecordedAt: number | null;
  categoryTags: string[];
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

const toReadableLabel = (raw: unknown): string => {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const stringifySupplementaryValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => stringifySupplementaryValue(entry))
      .filter((entry) => entry.length > 0)
      .join(", ");
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const preferred = objectValue.value ?? objectValue.val ?? objectValue.text;
    if (preferred !== undefined) {
      return stringifySupplementaryValue(preferred);
    }
    return JSON.stringify(objectValue);
  }
  return String(value).trim();
};

const entryFromRecord = (
  name: unknown,
  value: unknown
): SupplementaryParameter | null => {
  const readableName = toReadableLabel(name);
  const readableValue = stringifySupplementaryValue(value);
  if (!readableName || !readableValue) {
    return null;
  }
  return { name: readableName, value: readableValue };
};

const objectEntriesToParameters = (
  input: Record<string, unknown>
): SupplementaryParameter[] => {
  const entries = Object.entries(input)
    .map(([name, value]) => entryFromRecord(name, value))
    .filter((entry): entry is SupplementaryParameter => Boolean(entry));
  return entries;
};

const arrayEntriesToParameters = (
  input: unknown[]
): SupplementaryParameter[] => {
  const entries = input
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>;
        const nameCandidate =
          record.name ?? record.label ?? record.key ?? record.title;
        return entryFromRecord(
          nameCandidate,
          record.value ?? record.val ?? record.text ?? record.data ?? null
        );
      }
      if (typeof item === "string") {
        const separatorIndex = item.indexOf(":");
        if (separatorIndex !== -1) {
          const name = item.slice(0, separatorIndex).trim();
          const value = item.slice(separatorIndex + 1).trim();
          return entryFromRecord(name, value);
        }
      }
      return null;
    })
    .filter((entry): entry is SupplementaryParameter => Boolean(entry));
  return entries;
};

const parseKeyValueText = (
  value: string
): Record<string, unknown> | null => {
  const lines = value
    .split(/\r?\n|;/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const entries: Record<string, unknown> = {};
  lines.forEach((line) => {
    const separatorIndex = line.indexOf(":");
    const equalIndex = line.indexOf("=");
    const index = separatorIndex >= 0 ? separatorIndex : equalIndex;
    if (index === -1) {
      return;
    }
    const key = line.slice(0, index).trim();
    const rawValue = line.slice(index + 1).trim();
    if (key && rawValue) {
      entries[key] = rawValue;
    }
  });
  return Object.keys(entries).length > 0 ? entries : null;
};

const normalizeSupplementaryParameters = (
  source: ProductRow["supplementary_parameters"]
): SupplementaryParameter[] => {
  if (!source) {
    return [];
  }
  if (Array.isArray(source)) {
    return arrayEntriesToParameters(source);
  }
  if (typeof source === "object") {
    return objectEntriesToParameters(source as Record<string, unknown>);
  }
  if (typeof source === "string") {
    try {
      const parsed = JSON.parse(source) as unknown;
      if (Array.isArray(parsed)) {
        return arrayEntriesToParameters(parsed);
      }
      if (parsed && typeof parsed === "object") {
        return objectEntriesToParameters(parsed as Record<string, unknown>);
      }
    } catch {
      // ignore JSON parse errors and try fallback
    }
    const fallbackObject = parseKeyValueText(source);
    if (fallbackObject) {
      return objectEntriesToParameters(fallbackObject);
    }
  }
  return [];
};

const normalizeKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const CATEGORY_KEY = "herni kategorie";

const isCategoryParameter = (name: string): boolean =>
  normalizeKey(name) === CATEGORY_KEY;

const splitCategoryValues = (value: string): string[] =>
  value
    .split(/[\n,;/]/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const extractCategoryTags = (
  parameters: SupplementaryParameter[]
): string[] => {
  const collected = new Set<string>();
  parameters.forEach((parameter) => {
    if (!isCategoryParameter(parameter.name)) {
      return;
    }
    splitCategoryValues(parameter.value).forEach((entry) =>
      collected.add(entry)
    );
  });
  return Array.from(collected).sort((a, b) => a.localeCompare(b, "cs"));
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

const updateSupplementaryParameters = (
  draft: SeriesDraft,
  row: ProductRow
): void => {
  const normalized = normalizeSupplementaryParameters(
    row.supplementary_parameters ?? null
  );
  if (normalized.length === 0) {
    return;
  }
  const scrapedAt = toTimestamp(row.scraped_at);
  if (
    draft.supplementaryParameters.length === 0 ||
    (scrapedAt !== null &&
      (draft.supplementaryRecordedAt === null ||
        scrapedAt >= draft.supplementaryRecordedAt))
  ) {
    draft.supplementaryParameters = normalized;
    draft.supplementaryRecordedAt = scrapedAt;
    const categories = extractCategoryTags(normalized);
    if (categories.length > 0) {
      draft.categoryTags = categories;
    }
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
        supplementaryParameters: [],
        supplementaryRecordedAt: null,
        categoryTags: [],
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
    updateSupplementaryParameters(draft, row);
    appendPoint(draft, row);
  });

  return Array.from(drafts.values())
    .map((draft) => {
      const {
        availabilityRecordedAt: _availabilityRecordedAt,
        supplementaryRecordedAt: _supplementaryRecordedAt,
        ...seriesBase
      } = draft;
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

const toPointArray = (
  pricePoints: ProductCatalogIndexRow["price_points"]
): ProductSeries["points"] => {
  if (!Array.isArray(pricePoints)) {
    return [];
  }
  return pricePoints
    .map((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof (entry as Record<string, unknown>).rawDate !== "string"
      ) {
        return null;
      }
      const rawDate = (entry as Record<string, unknown>).rawDate as string;
      const priceValue = (entry as Record<string, unknown>).price;
      const price = toNumericPrice(priceValue);
      if (!rawDate || price === null) {
        return null;
      }
      return { rawDate, price };
    })
    .filter((point): point is ProductSeries["points"][number] => Boolean(point));
};

export const buildSeriesFromCatalogIndexRow = (
  row: ProductCatalogIndexRow
): ProductSeries => {
  const normalizedSupplementary = normalizeSupplementaryParameters(
    row.supplementary_parameters ?? null
  );
  const categoryTags = extractCategoryTags(normalizedSupplementary);
  const points = toPointArray(row.price_points);

  return {
    productCode: row.product_code,
    label: row.product_name,
    currency: row.currency_code ?? null,
    url: row.source_url ?? null,
    listPrice: toNumericPrice(row.list_price_with_vat),
    heroImage: row.hero_image_url ?? null,
    availabilityLabel: row.availability_label ?? null,
    shortDescription: toOptionalText(row.short_description),
    galleryImages: normalizeGalleryArray(row.gallery_image_urls),
    supplementaryParameters: normalizedSupplementary,
    categoryTags,
    points,
    latestPrice: toNumericPrice(row.latest_price),
    firstPrice: toNumericPrice(row.first_price),
    previousPrice: toNumericPrice(row.previous_price),
    latestScrapedAt: row.latest_scraped_at ?? null,
  };
};
