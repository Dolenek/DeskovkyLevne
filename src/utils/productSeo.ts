import type { LocaleKey } from "../i18n/translations";
import type { ProductSeries } from "../types/product";
import { formatPrice } from "./numberFormat";
import { getSellerDisplayName } from "./sellers";
import { buildAbsoluteUrl } from "./urls";

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

export const pickPrimaryImage = (series: ProductSeries): string | null => {
  if (series.heroImage?.trim()) {
    return series.heroImage;
  }
  const fallback = series.galleryImages?.find((image) => image.trim().length > 0);
  return fallback ?? null;
};

const collectImageSet = (series: ProductSeries): string[] => {
  const unique = new Set<string>();
  if (series.heroImage?.trim()) {
    unique.add(series.heroImage);
  }
  (series.galleryImages ?? []).forEach((image) => {
    const trimmed = image?.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  });
  return Array.from(unique).slice(0, 8);
};

export const buildProductDescription = (
  series: ProductSeries,
  locale: LocaleKey
): string => {
  if (series.shortDescription) {
    return truncateText(series.shortDescription, 200);
  }
  const sellerName = getSellerDisplayName(
    series.primarySeller ?? series.sellers[0]?.seller ?? null
  );
  const formattedPrice = formatPrice(
    series.latestPrice,
    series.currency ?? undefined,
    locale
  );
  if (formattedPrice !== "--") {
    return truncateText(
      locale === "en"
        ? `Track ${series.label} from ${sellerName} and other Czech stores. Current price ${formattedPrice}.`
        : `Sledujte ${series.label} od ${sellerName} a dalších českých obchodů. Aktuální cena ${formattedPrice}.`,
      200
    );
  }
  return truncateText(
    locale === "en"
      ? `Track price history and availability for ${series.label} across Czech board game shops.`
      : `Sledujte vývoj ceny a dostupnosti pro ${series.label} napříč českými obchody s deskovkami.`,
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
    url: seller.url ?? canonicalUrl,
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
  const images = collectImageSet(series)
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
