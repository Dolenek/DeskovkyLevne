import { sanitizeImageUrl } from "./urls";

interface ProductImageSource {
  heroImage?: string | null;
  galleryImages?: string[] | null;
}

const toLargeImageUrl = (url: string): string =>
  url.includes("/related/") ? url.replace("/related/", "/big/") : url;

const isUsableProductImage = (url: string): boolean => {
  const normalized = url.toLowerCase();
  return (
    normalized.length > 0 &&
    !normalized.includes("blank.gif") &&
    !normalized.includes("/150x150")
  );
};

export const collectProductImageUrls = (source: ProductImageSource): string[] => {
  const uniqueImages = new Set<string>();
  const orderedImages: string[] = [];
  const addImage = (url: string | null | undefined) => {
    const safeUrl = sanitizeImageUrl(url);
    if (!safeUrl) {
      return;
    }
    const largeImageUrl = toLargeImageUrl(safeUrl);
    if (!isUsableProductImage(largeImageUrl) || uniqueImages.has(largeImageUrl)) {
      return;
    }
    uniqueImages.add(largeImageUrl);
    orderedImages.push(largeImageUrl);
  };

  addImage(source.heroImage);
  (source.galleryImages ?? []).forEach(addImage);
  return orderedImages;
};

export const pickPrimaryProductImage = (
  source: ProductImageSource
): string | null => collectProductImageUrls(source)[0] ?? null;
