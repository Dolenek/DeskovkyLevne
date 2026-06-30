import type { ProductRow } from "../types/product";

const MOCK_PRODUCT_NAME = "Ukázková hra cenové historie";
const MOCK_DESCRIPTION =
  "Ukázkový produkt pro situaci, kdy se nepodaří načíst API. Data jsou sestavená tak, aby bylo možné zkontrolovat reálné rozložení detailu, graf cen, nabídky obchodů a základní informace.";

const MOCK_PARAMETERS = [
  { name: "Typ hry", value: "Rodinná hra" },
  { name: "Počet hráčů", value: "2-5" },
  { name: "Doba hraní", value: "30-45 minut" },
  { name: "Minimální věk", value: "8+" },
];

const MOCK_GALLERY_IMAGES = [
  "/assets/boardgame-scenes/hero-tabletop.webp",
  "/assets/boardgame-scenes/cta-components.png",
];

const PRICE_DATES = ["2026-04-01", "2026-04-15", "2026-05-01", "2026-05-15", "2026-06-01", "2026-06-30"];

const SELLER_PRICE_SERIES = [
  {
    seller: "tlamagames",
    productCode: "MOCK-TLAMA",
    url: "https://example.com/mock/tlama",
    availability: "Skladem",
    prices: [629, 619, 609, 599, 589, 579],
  },
  {
    seller: "najada",
    productCode: "MOCK-NAJADA",
    url: "https://example.com/mock/najada",
    availability: "Skladem >5 ks",
    prices: [649, 639, 619, 609, 599, 589],
  },
  {
    seller: "imago",
    productCode: "MOCK-IMAGO",
    url: "https://example.com/mock/imago",
    availability: "Skladem 2 ks",
    prices: [639, 629, 629, 615, 605, 595],
  },
];

export const buildMockProductRows = (slug: string): ProductRow[] =>
  SELLER_PRICE_SERIES.flatMap((sellerSeries, sellerIndex) =>
    PRICE_DATES.map((priceDate, priceIndex) => ({
      id: sellerIndex * PRICE_DATES.length + priceIndex + 1,
      product_code: sellerSeries.productCode,
      product_name_original: MOCK_PRODUCT_NAME,
      product_name_normalized: slug,
      price_with_vat: sellerSeries.prices[priceIndex] ?? null,
      list_price_with_vat: 699,
      currency_code: "CZK",
      source_url: sellerSeries.url,
      availability_label: sellerSeries.availability,
      stock_status_label: "Skladem",
      hero_image_url: MOCK_GALLERY_IMAGES[0] ?? null,
      gallery_image_urls: MOCK_GALLERY_IMAGES,
      short_description: MOCK_DESCRIPTION,
      scraped_at: `${priceDate}T08:00:00.000Z`,
      price_date: priceDate,
      snapshot_count: 1,
      supplementary_parameters: MOCK_PARAMETERS,
      metadata: { mock: true },
      seller: sellerSeries.seller,
    }))
  );
