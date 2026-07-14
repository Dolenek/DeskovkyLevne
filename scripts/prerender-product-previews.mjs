import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { injectSeoTags } from "./prerender-product-html.mjs";
import {
  absoluteImageUrl,
  sanitizeExternalHttpsUrl,
  sanitizeImageUrl,
} from "./public-url-safety.mjs";

const PAGE_SIZE = 1000;
const SLUG_TABLE_NAME = "catalog_slug_state";
const SELLER_TABLE_NAME = "catalog_slug_seller_state";

const fetchPagedRows = async (client, tableName, selectColumns, orderColumn) => {
  if (!client) {
    return [];
  }

  const rows = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client
      .from(tableName)
      .select(selectColumns)
      .order(orderColumn, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      break;
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }
  return rows;
};

const fetchProductPreviewRows = (client) =>
  fetchPagedRows(
    client,
    SLUG_TABLE_NAME,
    [
      "product_name_normalized",
      "product_code",
      "product_name",
      "currency_code",
      "hero_image_url",
      "gallery_image_urls",
      "category_tags",
      "seller_count",
    ].join(","),
    "product_name_normalized"
  );

const fetchSellerPreviewRows = (client) =>
  fetchPagedRows(
    client,
    SELLER_TABLE_NAME,
    [
      "product_name_normalized",
      "seller",
      "product_code",
      "currency_code",
      "availability_label",
      "latest_price",
      "source_url",
      "hero_image_url",
      "gallery_image_urls",
    ].join(","),
    "product_name_normalized"
  );

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
};

const toLargeImageUrl = (url) =>
  url.includes("/related/") ? url.replace("/related/", "/big/") : url;

const isUsableProductImage = (url) => {
  const normalized = url.toLowerCase();
  return (
    normalized.length > 0 &&
    !normalized.includes("blank.gif") &&
    !normalized.includes("/150x150")
  );
};

const collectProductImages = (productRow, sellerRows) => {
  const uniqueImages = new Set();
  const orderedImages = [];
  const addImage = (url) => {
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

  addImage(productRow.hero_image_url);
  normalizeArray(productRow.gallery_image_urls).forEach(addImage);
  sellerRows.forEach((sellerRow) => {
    addImage(sellerRow.hero_image_url);
    normalizeArray(sellerRow.gallery_image_urls).forEach(addImage);
  });
  return orderedImages;
};

export const toFinitePrice = (value) => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const formatPrice = (value, currency) => {
  if (value === null) {
    return null;
  }
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: currency || "CZK",
    maximumFractionDigits: 2,
  }).format(value);
};

const sellerCountText = (count) =>
  count === 1 ? "1 e-shopu" : `${count} e-shopech`;

const mapAvailabilityToSchema = (availability) => {
  const normalized = String(availability ?? "").toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized.includes("předprodej") || normalized.includes("preorder")) {
    return "https://schema.org/PreOrder";
  }
  if (normalized.includes("skladem") || normalized.includes("in stock")) {
    return "https://schema.org/InStock";
  }
  if (normalized.includes("není") || normalized.includes("vyprodáno")) {
    return "https://schema.org/OutOfStock";
  }
  return undefined;
};

const truncateText = (value, limit = 200) => {
  const clean = String(value).replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 3)}...`;
};

const productLabel = (productRow) =>
  productRow.product_name?.trim() ||
  productRow.product_code?.trim() ||
  productRow.product_name_normalized?.trim() ||
  "Desková hra";

const lowestSeller = (sellerRows) =>
  sellerRows
    .map((sellerRow) => ({
      ...sellerRow,
      comparablePrice: toFinitePrice(sellerRow.latest_price),
    }))
    .filter((sellerRow) => sellerRow.comparablePrice !== null)
    .sort((left, right) => left.comparablePrice - right.comparablePrice)[0] ??
  null;

const buildDescription = (label, productRow, sellerRows) => {
  const sellerCount = Math.max(
    Number(productRow.seller_count) || sellerRows.length || 1,
    1
  );
  const seller = lowestSeller(sellerRows);
  const price = seller ? formatPrice(seller.comparablePrice, seller.currency_code) : null;
  if (price) {
    return truncateText(
      `Srovnejte nabídky hry ${label} v ${sellerCountText(sellerCount)}. Nejlevněji aktuálně ${price}. Sledujte dostupnost a historii cen.`
    );
  }
  return truncateText(
    `Srovnejte nabídky hry ${label} v ${sellerCountText(sellerCount)}. Sledujte dostupnost a historii cen v českých obchodech.`
  );
};

const buildStructuredData = (metadata, productRow, sellerRows, siteUrl) => {
  const offers = sellerRows
    .map((sellerRow) => {
      const price = toFinitePrice(sellerRow.latest_price);
      if (price === null) {
        return null;
      }
      return {
        "@type": "Offer",
        url: sanitizeExternalHttpsUrl(sellerRow.source_url) ?? metadata.canonicalUrl,
        priceCurrency: sellerRow.currency_code ?? productRow.currency_code ?? "CZK",
        price,
        availability: mapAvailabilityToSchema(sellerRow.availability_label),
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: sellerRow.seller ?? "unknown",
        },
      };
    })
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: metadata.label,
    description: metadata.description,
    sku: productRow.product_code ?? productRow.product_name_normalized,
    productID: productRow.product_name_normalized,
    url: metadata.canonicalUrl,
    image: metadata.images.map((image) => absoluteImageUrl(siteUrl, image)).filter(Boolean),
    category: normalizeArray(productRow.category_tags),
    offers,
    inLanguage: "cs",
  };
};

const buildProductMetadata = (productRow, sellerRows, siteUrl) => {
  const slug = productRow.product_name_normalized?.trim();
  const label = productLabel(productRow);
  const canonicalUrl = `${siteUrl}/deskove-hry/${encodeURIComponent(slug)}`;
  const images = collectProductImages(productRow, sellerRows);
  const description = buildDescription(label, productRow, sellerRows);
  const metadata = {
    slug,
    label,
    title: `${label} | Deskovky levně`,
    description,
    canonicalUrl,
    imageUrl: absoluteImageUrl(siteUrl, images[0]),
    images,
  };
  return {
    ...metadata,
    structuredData: buildStructuredData(metadata, productRow, sellerRows, siteUrl),
  };
};

const groupSellerRowsBySlug = (sellerRows) => {
  const groupedRows = new Map();
  sellerRows.forEach((sellerRow) => {
    const slug = sellerRow.product_name_normalized?.trim();
    if (!slug) {
      return;
    }
    const existingRows = groupedRows.get(slug) ?? [];
    existingRows.push(sellerRow);
    groupedRows.set(slug, existingRows);
  });
  return groupedRows;
};

const writeHtmlForRoute = async (distDir, routePath, html) => {
  const normalizedPath = routePath.replace(/^\/+/, "");
  const targetPath = path.join(distDir, normalizedPath, "index.html");
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, html, "utf8");
};

export const generateProductPreviewPages = async ({
  client,
  distDir,
  shellHtml,
  siteUrl,
}) => {
  if (!client) {
    return;
  }

  const [productRows, sellerRows] = await Promise.all([
    fetchProductPreviewRows(client),
    fetchSellerPreviewRows(client),
  ]);
  const sellersBySlug = groupSellerRowsBySlug(sellerRows);
  let generatedCount = 0;

  for (const productRow of productRows) {
    const slug = productRow.product_name_normalized?.trim();
    if (!slug) {
      continue;
    }
    const metadata = buildProductMetadata(
      productRow,
      sellersBySlug.get(slug) ?? [],
      siteUrl
    );
    const html = injectSeoTags(shellHtml, metadata);
    await writeHtmlForRoute(distDir, `/deskove-hry/${encodeURIComponent(slug)}`, html);
    generatedCount += 1;
  }

  console.log(`Generated product SEO previews for ${generatedCount} URLs.`);
};
