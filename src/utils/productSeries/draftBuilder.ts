import type { ProductRow } from "../../types/product";
import { toDateKey } from "../date";
import {
  extractCategoryTags,
  normalizeSupplementaryParameters,
} from "../supplementary";
import {
  normalizeGalleryArray,
  slugify,
  toNumericPrice,
  toOptionalText,
} from "../productTransformPrimitives";
import { SELLER_PRIORITY } from "./types";
import type { ProductDraft, SellerDraft } from "./types";
import { sanitizeExternalHttpsUrl, sanitizeImageUrl } from "../urls";

const toTimestamp = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }
  const parsedValue = Date.parse(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const normalizeSellerId = (seller?: string | null): string =>
  seller?.trim().toLowerCase() || "unknown";

const resolvePointDate = (row: ProductRow): string | null => {
  const priceDate = row.price_date?.trim();
  if (priceDate) {
    return priceDate;
  }
  return row.scraped_at ? toDateKey(row.scraped_at) : null;
};

const toSeriesLabel = (row: ProductRow): string =>
  row.product_name_original?.trim() ||
  row.product_code?.trim() ||
  row.product_name_normalized?.trim() ||
  "Neznámý produkt";

const toAuthoritativePrice = (
  value: number | null | undefined
): number | null | undefined =>
  value === undefined ? undefined : toNumericPrice(value);

export const resolveSlug = (row: ProductRow): string | null => {
  const normalizedSlug = row.product_name_normalized?.trim().toLowerCase();
  if (normalizedSlug) {
    return normalizedSlug;
  }

  const fallbackCode = row.product_code?.trim().toLowerCase();
  if (fallbackCode) {
    return fallbackCode;
  }

  const fallbackName = row.product_name_original?.trim();
  if (!fallbackName) {
    return null;
  }
  const generatedSlug = slugify(fallbackName);
  return generatedSlug.length > 0 ? generatedSlug : null;
};

const createSellerDraft = (
  slug: string,
  sellerId: string,
  row: ProductRow
): SellerDraft => ({
  slug,
  sellerId,
  productCode: row.product_code ?? null,
  label: toSeriesLabel(row),
  currency: row.currency_code ?? null,
  url: sanitizeExternalHttpsUrl(row.source_url),
  listPrice: toNumericPrice(row.list_price_with_vat),
  latestPrice: toAuthoritativePrice(row.latest_price),
  previousPrice: toAuthoritativePrice(row.previous_price),
  firstPrice: toAuthoritativePrice(row.first_price),
  latestScrapedAt: row.latest_scraped_at ?? null,
  heroImage: sanitizeImageUrl(row.hero_image_url),
  availabilityLabel: row.availability_label ?? null,
  availabilityRecordedAt: toTimestamp(row.scraped_at),
  shortDescription: toOptionalText(row.short_description),
  galleryImages: normalizeGalleryArray(row.gallery_image_urls),
  supplementaryParameters: [],
  supplementaryRecordedAt: null,
  categoryTags: [],
  points: [],
});

const appendPoint = (draft: SellerDraft, row: ProductRow) => {
  const numericPrice = toNumericPrice(row.price_with_vat);
  const pointDate = resolvePointDate(row);
  if (numericPrice === null || !pointDate) {
    return;
  }
  draft.points.push({
    rawDate: pointDate,
    price: numericPrice,
  });
};

const mergeGalleryImages = (draft: SellerDraft, row: ProductRow) => {
  const incomingImages = normalizeGalleryArray(row.gallery_image_urls);
  if (incomingImages.length === 0) {
    return;
  }
  const mergedImages = new Set(draft.galleryImages ?? []);
  incomingImages.forEach((url) => mergedImages.add(url));
  draft.galleryImages = Array.from(mergedImages);
};

const updateAvailabilityLabel = (draft: SellerDraft, row: ProductRow) => {
  const scrapedAt = toTimestamp(row.scraped_at);
  if (scrapedAt === null) {
    return;
  }
  if (draft.availabilityRecordedAt === null || scrapedAt >= draft.availabilityRecordedAt) {
    draft.availabilityLabel = row.availability_label ?? null;
    draft.availabilityRecordedAt = scrapedAt;
  }
};

const updateSupplementaryParameters = (draft: SellerDraft, row: ProductRow) => {
  const normalizedParameters = normalizeSupplementaryParameters(
    row.supplementary_parameters ?? null
  );
  if (normalizedParameters.length === 0) {
    return;
  }

  const scrapedAt = toTimestamp(row.scraped_at);
  const shouldReplace =
    draft.supplementaryParameters.length === 0 ||
    (scrapedAt !== null &&
      (draft.supplementaryRecordedAt === null ||
        scrapedAt >= draft.supplementaryRecordedAt));
  if (!shouldReplace) {
    return;
  }

  draft.supplementaryParameters = normalizedParameters;
  draft.supplementaryRecordedAt = scrapedAt;
  const categories = extractCategoryTags(normalizedParameters);
  if (categories.length > 0) {
    draft.categoryTags = categories;
  }
};

const applyOptionalFields = (draft: SellerDraft, row: ProductRow) => {
  if (draft.listPrice === null && row.list_price_with_vat !== null) {
    draft.listPrice = toNumericPrice(row.list_price_with_vat);
  }
  if (!draft.heroImage && row.hero_image_url) {
    draft.heroImage = sanitizeImageUrl(row.hero_image_url);
  }
  if (!draft.shortDescription && row.short_description) {
    draft.shortDescription = toOptionalText(row.short_description);
  }
  if (!draft.url && row.source_url) {
    draft.url = sanitizeExternalHttpsUrl(row.source_url);
  }
  if (!draft.currency && row.currency_code) {
    draft.currency = row.currency_code;
  }
  if (draft.latestPrice === undefined && row.latest_price !== undefined) {
    draft.latestPrice = toNumericPrice(row.latest_price);
  }
  if (draft.previousPrice === undefined && row.previous_price !== undefined) {
    draft.previousPrice = toNumericPrice(row.previous_price);
  }
  if (draft.firstPrice === undefined && row.first_price !== undefined) {
    draft.firstPrice = toNumericPrice(row.first_price);
  }
  draft.latestScrapedAt ??= row.latest_scraped_at ?? null;
};

const ensureProductDraft = (drafts: Map<string, ProductDraft>, row: ProductRow) => {
  const slug = resolveSlug(row);
  if (!slug) {
    return null;
  }
  if (!drafts.has(slug)) {
    drafts.set(slug, {
      slug,
      label: toSeriesLabel(row),
      sellers: new Map(),
    });
  }
  return drafts.get(slug)!;
};

const ensureSellerDraft = (productDraft: ProductDraft, row: ProductRow) => {
  const sellerId = normalizeSellerId(row.seller);
  if (!productDraft.sellers.has(sellerId)) {
    productDraft.sellers.set(
      sellerId,
      createSellerDraft(productDraft.slug, sellerId, row)
    );
  }
  return productDraft.sellers.get(sellerId)!;
};

export const updateDraftsWithRow = (
  drafts: Map<string, ProductDraft>,
  row: ProductRow
) => {
  const productDraft = ensureProductDraft(drafts, row);
  if (!productDraft) {
    return;
  }

  const sellerDraft = ensureSellerDraft(productDraft, row);
  applyOptionalFields(sellerDraft, row);
  updateAvailabilityLabel(sellerDraft, row);
  mergeGalleryImages(sellerDraft, row);
  updateSupplementaryParameters(sellerDraft, row);
  appendPoint(sellerDraft, row);
};

const sellerRank = (sellerId: string): number => {
  const priorityIndex = SELLER_PRIORITY.indexOf(sellerId);
  return priorityIndex === -1 ? SELLER_PRIORITY.length : priorityIndex;
};

export const compareSellerDrafts = (left: SellerDraft, right: SellerDraft) => {
  const rankDiff = sellerRank(left.sellerId) - sellerRank(right.sellerId);
  if (rankDiff !== 0) {
    return rankDiff;
  }
  return left.label.localeCompare(right.label, "cs");
};
