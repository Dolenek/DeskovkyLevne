import type { ProductRow, ProductSeries, SupplementaryParameter } from "../types/product";
import { toDateKey } from "./date";
import {
  extractCategoryTags,
  normalizeSupplementaryParameters,
} from "./supplementary";
import {
  normalizeGalleryArray,
  slugify,
  toNumericPrice,
  toOptionalText,
} from "./productTransformPrimitives";

interface SellerDraft {
  slug: string;
  sellerId: string;
  productCode: string | null;
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

interface ProductDraft {
  slug: string;
  label: string;
  sellers: Map<string, SellerDraft>;
}

const SELLER_PRIORITY = ["tlamagames", "tlamagase", "planetaher"];

const toTimestamp = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeSellerId = (seller?: string | null): string =>
  seller?.trim().toLowerCase() || "unknown";

const sellerRank = (sellerId: string): number => {
  const index = SELLER_PRIORITY.indexOf(sellerId);
  return index === -1 ? SELLER_PRIORITY.length : index;
};

const compareSellerDraft = (a: SellerDraft, b: SellerDraft): number => {
  const rankDiff = sellerRank(a.sellerId) - sellerRank(b.sellerId);
  if (rankDiff !== 0) {
    return rankDiff;
  }
  return a.label.localeCompare(b.label, "cs");
};

const resolveSlug = (row: ProductRow): string | null => {
  const normalized = row.product_name_normalized?.trim().toLowerCase();
  if (normalized) {
    return normalized;
  }
  const fallbackCode = row.product_code?.trim().toLowerCase();
  if (fallbackCode) {
    return fallbackCode;
  }
  const fallbackName = row.product_name_original?.trim();
  if (fallbackName) {
    const slug = slugify(fallbackName);
    return slug.length > 0 ? slug : null;
  }
  return null;
};

const toSeriesLabel = (row: ProductRow): string =>
  row.product_name_original?.trim() ||
  row.product_code?.trim() ||
  row.product_name_normalized?.trim() ||
  "Neznámý produkt";

const appendPoint = (draft: SellerDraft, row: ProductRow) => {
  const price = toNumericPrice(row.price_with_vat);
  if (price === null || !row.scraped_at) {
    return;
  }

  draft.points.push({
    rawDate: toDateKey(row.scraped_at),
    price,
  });
};

const mergeGalleryImages = (draft: SellerDraft, row: ProductRow): void => {
  const incoming = normalizeGalleryArray(row.gallery_image_urls);
  if (incoming.length === 0) {
    return;
  }
  const existing = draft.galleryImages ?? [];
  const merged = new Set(existing);
  incoming.forEach((url) => merged.add(url));
  draft.galleryImages = Array.from(merged);
};



const updateAvailabilityLabel = (draft: SellerDraft, row: ProductRow): void => {
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
  draft: SellerDraft,
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
  const drafts = new Map<string, ProductDraft>();

  rows.forEach((row) => {
    const slug = resolveSlug(row);
    if (!slug) {
      return;
    }
    const sellerId = normalizeSellerId(row.seller);
    if (!drafts.has(slug)) {
      drafts.set(slug, {
        slug,
        label: toSeriesLabel(row),
        sellers: new Map(),
      });
    }
    const productDraft = drafts.get(slug)!;
    if (!productDraft.sellers.has(sellerId)) {
      productDraft.sellers.set(sellerId, {
        slug,
        sellerId,
        productCode: row.product_code ?? null,
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
    const sellerDraft = productDraft.sellers.get(sellerId)!;
    if (sellerDraft.listPrice === null && row.list_price_with_vat !== null) {
      sellerDraft.listPrice = toNumericPrice(row.list_price_with_vat);
    }
    if (!sellerDraft.heroImage && row.hero_image_url) {
      sellerDraft.heroImage = row.hero_image_url;
    }
    if (!sellerDraft.shortDescription && row.short_description) {
      sellerDraft.shortDescription = toOptionalText(row.short_description);
    }
    if (!sellerDraft.url && row.source_url) {
      sellerDraft.url = row.source_url;
    }
    if (!sellerDraft.currency && row.currency_code) {
      sellerDraft.currency = row.currency_code;
    }
    updateAvailabilityLabel(sellerDraft, row);
    mergeGalleryImages(sellerDraft, row);
    updateSupplementaryParameters(sellerDraft, row);
    appendPoint(sellerDraft, row);
  });

  const finalizeSeller = (
    draft: SellerDraft
  ): ProductSeries["sellers"][number] => {
    const points = draft.points
      .sort(
        (a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
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
      seller: draft.sellerId,
      productCode: draft.productCode,
      label: draft.label,
      currency: draft.currency ?? null,
      url: draft.url ?? null,
      listPrice: draft.listPrice,
      heroImage: draft.heroImage ?? null,
      availabilityLabel: draft.availabilityLabel ?? null,
      shortDescription: draft.shortDescription ?? null,
      galleryImages: draft.galleryImages ?? [],
      supplementaryParameters: draft.supplementaryParameters,
      categoryTags: draft.categoryTags,
      points,
      latestPrice,
      firstPrice,
      previousPrice,
      latestScrapedAt,
    };
  };

  const seriesList: ProductSeries[] = [];

  drafts.forEach((product) => {
    const sellerDrafts = Array.from(product.sellers.values()).sort(
      (a, b) => compareSellerDraft(a, b)
    );
    const sellers = sellerDrafts
      .map(finalizeSeller)
      .filter((seller) => seller.points.length > 0);
    if (sellers.length === 0) {
      return;
    }
    const primary = sellers[0];
    const categoryTags = Array.from(
      sellers.reduce((set, seller) => {
        seller.categoryTags.forEach((category) => set.add(category));
        return set;
      }, new Set<string>())
    ).sort((a, b) => a.localeCompare(b, "cs"));
    const heroImage =
      primary.heroImage ??
      sellers.find((seller) => seller.heroImage)?.heroImage ??
      null;
    const shortDescription =
      primary.shortDescription ??
      sellers.find((seller) => seller.shortDescription)?.shortDescription ??
      null;
    const galleryImages = (() => {
      const merged = new Set<string>();
      sellers.forEach((seller) => {
        (seller.galleryImages ?? []).forEach((image) => merged.add(image));
      });
      if (merged.size === 0) {
        return primary.galleryImages ?? [];
      }
      return Array.from(merged);
    })();

    seriesList.push({
      slug: product.slug,
      primaryProductCode: primary.productCode ?? null,
      label: primary.label || product.label,
      currency: primary.currency ?? null,
      url: primary.url ?? null,
      listPrice: primary.listPrice,
      heroImage,
      availabilityLabel: primary.availabilityLabel ?? null,
      shortDescription,
      galleryImages,
      supplementaryParameters: primary.supplementaryParameters,
      categoryTags,
      points: primary.points,
      latestPrice: primary.latestPrice,
      firstPrice: primary.firstPrice,
      previousPrice: primary.previousPrice,
      latestScrapedAt: primary.latestScrapedAt,
      sellers,
      primarySeller: primary.seller,
    });
  });

  return seriesList.sort((a, b) => a.label.localeCompare(b.label, "cs"));
};
