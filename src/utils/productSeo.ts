import type { LocaleKey } from "../i18n/translations";
import type { ProductSeries } from "../types/product";
import { formatPrice } from "./numberFormat";
import { collectProductImageUrls, pickPrimaryProductImage } from "./productImages";
import { getLatestComparablePrice, getLowestSeller } from "./priceStats";
import { getSellerDisplayName } from "./sellers";
import { buildAbsoluteUrl, sanitizeExternalHttpsUrl } from "./urls";

const mapAvailabilityToSchema = (availability?: string | null): string | undefined => {
  if (!availability) {
    return undefined;
  }
  const normalized = availability.toLowerCase();
  if (
    normalized.includes("předprodej") ||
    normalized.includes("preorder") ||
    normalized.includes("pre-order") ||
    normalized.includes("předobjednávka") ||
    normalized.includes("predprodej") ||
    normalized.includes("predobjednavka")
  ) {
    return "https://schema.org/PreOrder";
  }
  if (normalized.includes("skladem") || normalized.includes("in stock")) {
    return "https://schema.org/InStock";
  }
  if (
    normalized.includes("není") ||
    normalized.includes("vyprodáno") ||
    normalized.includes("out of stock")
  ) {
    return "https://schema.org/OutOfStock";
  }
  return undefined;
};

const truncateText = (value: string, limit = 200): string => {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) {
    return clean;
  }
  return `${clean.slice(0, limit - 3)}...`;
};

export const buildProductTitle = (series: ProductSeries): string =>
  `${series.label} | Deskovky levně`;

const buildSellerCountText = (count: number, locale: LocaleKey): string => {
  if (locale === "en") {
    return count === 1 ? "1 shop" : `${count} shops`;
  }
  if (count === 1) {
    return "1 e-shopu";
  }
  return `${count} e-shopech`;
};

export const pickPrimaryImage = (series: ProductSeries): string | null =>
  pickPrimaryProductImage(series);

export const buildProductSeoDescription = (
  series: ProductSeries,
  locale: LocaleKey
): string => {
  const sellerCountText = buildSellerCountText(
    Math.max(series.sellers.length, 1),
    locale
  );
  const lowestSeller = getLowestSeller(series);
  const lowestPrice = lowestSeller ? getLatestComparablePrice(lowestSeller) : null;
  const formattedPrice = formatPrice(
    lowestPrice,
    lowestSeller?.currency ?? series.currency ?? undefined,
    locale
  );

  if (formattedPrice !== "--") {
    return truncateText(
      locale === "en"
        ? `Compare offers for ${series.label} across ${sellerCountText}. Current lowest price ${formattedPrice}. Track availability and price history.`
        : `Srovnejte nabídky hry ${series.label} v ${sellerCountText}. Nejlevněji aktuálně ${formattedPrice}. Sledujte dostupnost a historii cen.`,
      200
    );
  }

  return truncateText(
    locale === "en"
      ? `Compare offers for ${series.label} across ${sellerCountText}. Track availability and price history across Czech board game shops.`
      : `Srovnejte nabídky hry ${series.label} v ${sellerCountText}. Sledujte dostupnost a historii cen v českých obchodech.`,
    200
  );
};

const buildOfferEntry = (
  seller: ProductSeries["sellers"][number],
  series: ProductSeries,
  canonicalUrl: string
): Record<string, unknown> | null => {
  if (seller.latestPrice === null) {
    return null;
  }
  return {
    "@type": "Offer",
    url: sanitizeExternalHttpsUrl(seller.url) ?? canonicalUrl,
    priceCurrency: seller.currency ?? series.currency ?? "CZK",
    price: seller.latestPrice,
    availability: mapAvailabilityToSchema(seller.availabilityLabel),
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: getSellerDisplayName(seller.seller ?? "unknown"),
    },
  };
};

export const buildProductStructuredData = (
  series: ProductSeries,
  canonicalUrl: string,
  locale: LocaleKey,
  description: string
): Record<string, unknown> => {
  const offers = series.sellers
    .map((seller) => buildOfferEntry(seller, series, canonicalUrl))
    .filter((offer): offer is Record<string, unknown> => Boolean(offer));
  const images = collectProductImageUrls(series)
    .slice(0, 8)
    .map((image) => buildAbsoluteUrl(image) ?? image)
    .filter((image): image is string => Boolean(image));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: series.label,
    description,
    sku: series.primaryProductCode ?? series.slug,
    productID: series.slug,
    url: canonicalUrl,
    image: images,
    category: series.categoryTags,
    offers,
    inLanguage: locale === "en" ? "en" : "cs",
  };
};
