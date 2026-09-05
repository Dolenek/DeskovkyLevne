import type { ProductSeries } from "../../types/product";
import type { ProductDraft, SellerDraft } from "./types";

const deduplicatePoints = (points: ProductSeries["points"]) =>
  points
    .sort((left, right) => new Date(left.rawDate).getTime() - new Date(right.rawDate).getTime())
    .filter(
      (point, index, allPoints) =>
        index === 0 || point.rawDate !== allPoints[index - 1]?.rawDate
    );

const resolveSellerPrices = (draft: SellerDraft, points: ProductSeries["points"]) => {
  const firstPrice =
    draft.firstPrice !== undefined ? draft.firstPrice : points[0]?.price ?? null;
  const latestPrice =
    draft.latestPrice !== undefined
      ? draft.latestPrice
      : points[points.length - 1]?.price ?? null;
  const previousPrice =
    draft.previousPrice !== undefined
      ? draft.previousPrice
      : points.length > 1
        ? points[points.length - 2]?.price ?? null
        : null;
  const latestScrapedAt =
    draft.latestScrapedAt ?? points[points.length - 1]?.rawDate ?? null;
  return { firstPrice, latestPrice, previousPrice, latestScrapedAt };
};

const finalizeSeller = (draft: SellerDraft): ProductSeries["sellers"][number] => {
  const points = deduplicatePoints(draft.points);
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
    ...resolveSellerPrices(draft, points),
  };
};

const mergeCategoryTags = (sellers: ProductSeries["sellers"]) =>
  Array.from(
    sellers.reduce((set, seller) => {
      seller.categoryTags.forEach((category) => set.add(category));
      return set;
    }, new Set<string>())
  ).sort((left, right) => left.localeCompare(right, "cs"));

const mergeGalleryImages = (sellers: ProductSeries["sellers"]) => {
  const mergedImages = new Set<string>();
  sellers.forEach((seller) => {
    (seller.galleryImages ?? []).forEach((image) => mergedImages.add(image));
  });
  if (mergedImages.size > 0) {
    return Array.from(mergedImages);
  }
  return sellers[0]?.galleryImages ?? [];
};

const resolveProductPresentation = (sellers: ProductSeries["sellers"]) => {
  const heroImage =
    sellers.find((seller) => seller.heroImage)?.heroImage ??
    null;
  const shortDescription =
    sellers.find((seller) => seller.shortDescription)?.shortDescription ??
    null;
  return { heroImage, shortDescription };
};

export const finalizeProductDraft = (
  productDraft: ProductDraft,
  sortedSellers: SellerDraft[]
): ProductSeries | null => {
  const sellers = sortedSellers.map(finalizeSeller);
  const primarySeller = sellers[0];
  if (!primarySeller) {
    return null;
  }
  return {
    slug: productDraft.slug,
    primaryProductCode: primarySeller.productCode ?? null,
    label: primarySeller.label || productDraft.label,
    currency: primarySeller.currency ?? null,
    url: primarySeller.url ?? null,
    listPrice: primarySeller.listPrice,
    ...resolveProductPresentation(sellers),
    availabilityLabel: primarySeller.availabilityLabel ?? null,
    galleryImages: mergeGalleryImages(sellers),
    supplementaryParameters: primarySeller.supplementaryParameters,
    categoryTags: mergeCategoryTags(sellers),
    points: primarySeller.points,
    latestPrice: primarySeller.latestPrice,
    firstPrice: primarySeller.firstPrice,
    previousPrice: primarySeller.previousPrice,
    latestScrapedAt: primarySeller.latestScrapedAt,
    sellers,
    primarySeller: primarySeller.seller,
    sellerCount: sellers.length,
  };
};
