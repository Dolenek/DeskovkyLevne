import type {
  CatalogSearchRow,
  ProductCatalogIndexRow,
  ProductSearchResult,
  ProductSeries,
} from "../types/product";
import {
  normalizeGalleryArray,
  slugify,
  toNumericPrice,
  toOptionalText,
} from "./productTransformPrimitives";
import {
  extractCategoryTags,
  normalizeSupplementaryParameters,
} from "./supplementary";

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

const resolveCatalogSlug = (row: CatalogSearchRow): string => {
  const normalized = row.product_name_normalized?.trim().toLowerCase();
  if (normalized) {
    return normalized;
  }
  const fallbackName = row.product_name?.trim() ?? "";
  if (fallbackName) {
    const slug = slugify(fallbackName);
    if (slug) {
      return slug;
    }
  }
  const fallbackCode = row.product_code?.trim().toLowerCase();
  if (fallbackCode) {
    return fallbackCode;
  }
  return "unknown";
};

const buildCatalogLabel = (row: ProductCatalogIndexRow): string =>
  row.product_name_original?.trim() ??
  row.product_name?.trim() ??
  row.product_code ??
  row.product_name_normalized ??
  "Neznámý produkt";

const buildCatalogSellerId = (row: ProductCatalogIndexRow): string =>
  (typeof row.metadata === "object" && row.metadata
    ? ((row.metadata as Record<string, unknown>).seller as string | undefined)
    : null) ?? "catalog";

const toCatalogSearchRow = (row: ProductCatalogIndexRow): CatalogSearchRow => ({
  product_code: row.product_code,
  product_name: row.product_name ?? row.product_name_original ?? null,
  product_name_normalized: row.product_name_normalized ?? null,
  product_name_search: row.product_name_search ?? null,
  currency_code: row.currency_code,
  availability_label: row.availability_label,
  latest_price: row.latest_price,
  hero_image_url: row.hero_image_url,
  gallery_image_urls: row.gallery_image_urls,
});

const buildCatalogSellerEntry = (
  row: ProductCatalogIndexRow,
  label: string,
  normalizedSupplementary: ReturnType<typeof normalizeSupplementaryParameters>,
  categoryTags: string[],
  points: ProductSeries["points"]
): ProductSeries["sellers"][number] => ({
  seller: buildCatalogSellerId(row),
  productCode: row.product_code ?? null,
  label,
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
});

export const buildSeriesFromCatalogIndexRow = (
  row: ProductCatalogIndexRow
): ProductSeries => {
  const normalizedSupplementary = normalizeSupplementaryParameters(
    row.supplementary_parameters ?? null
  );
  const categoryTagsFromRow = Array.isArray(row.category_tags)
    ? row.category_tags.filter(
        (tag): tag is string => typeof tag === "string" && tag.trim().length > 0
      )
    : [];
  const categoryTags =
    categoryTagsFromRow.length > 0
      ? categoryTagsFromRow
      : extractCategoryTags(normalizedSupplementary);
  const points = toPointArray(row.price_points);
  const slug = resolveCatalogSlug(toCatalogSearchRow(row));
  const label = buildCatalogLabel(row);
  const sellerEntry = buildCatalogSellerEntry(
    row,
    label,
    normalizedSupplementary,
    categoryTags,
    points
  );

  return {
    slug,
    primaryProductCode: sellerEntry.productCode ?? null,
    label,
    currency: sellerEntry.currency,
    url: sellerEntry.url,
    listPrice: sellerEntry.listPrice,
    heroImage: sellerEntry.heroImage,
    availabilityLabel: sellerEntry.availabilityLabel,
    shortDescription: sellerEntry.shortDescription,
    galleryImages: sellerEntry.galleryImages,
    supplementaryParameters: sellerEntry.supplementaryParameters,
    categoryTags,
    points,
    latestPrice: sellerEntry.latestPrice,
    firstPrice: sellerEntry.firstPrice,
    previousPrice: sellerEntry.previousPrice,
    latestScrapedAt: sellerEntry.latestScrapedAt,
    sellers: [sellerEntry],
    primarySeller: sellerEntry.seller,
  };
};

export const buildSearchResultFromCatalogRow = (
  row: CatalogSearchRow
): ProductSearchResult => ({
  slug: resolveCatalogSlug(row),
  label:
    row.product_name?.trim() || row.product_code?.trim() || "Neznámý produkt",
  primaryProductCode: row.product_code ?? null,
  heroImage: row.hero_image_url ?? null,
  galleryImages: normalizeGalleryArray(row.gallery_image_urls),
  availabilityLabel: row.availability_label ?? null,
  latestPrice: toNumericPrice(row.latest_price),
  currency: row.currency_code ?? null,
});
