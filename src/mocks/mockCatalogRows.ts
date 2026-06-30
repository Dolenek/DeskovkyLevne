import type { CatalogSearchRow, ProductCatalogIndexRow } from "../types/product";

const MOCK_SLUG = "ukazkova-hra-cenove-historie";
const MOCK_NAME = "Ukázková hra cenové historie";
const MOCK_IMAGES = [
  "/assets/boardgame-scenes/hero-tabletop.webp",
  "/assets/boardgame-scenes/cta-components.png",
];
const MOCK_CATEGORY_TAGS = ["Strategická", "Rodinná", "Fantasy", "Kooperativní", "Ekonomická"];
const MOCK_PRICE_POINTS = [
  { rawDate: "2026-04-01", price: 629 },
  { rawDate: "2026-04-15", price: 619 },
  { rawDate: "2026-05-01", price: 609 },
  { rawDate: "2026-05-15", price: 599 },
  { rawDate: "2026-06-01", price: 589 },
  { rawDate: "2026-06-30", price: 579 },
];

export const MOCK_CATALOG_ROW: ProductCatalogIndexRow = {
  product_code: "MOCK-CATALOG-001",
  product_name: MOCK_NAME,
  product_name_original: MOCK_NAME,
  product_name_normalized: MOCK_SLUG,
  product_name_search: "ukazkova hra cenove historie",
  currency_code: "CZK",
  availability_label: "Skladem",
  stock_status_label: "Skladem",
  latest_price: 579,
  previous_price: 589,
  first_price: 629,
  list_price_with_vat: 699,
  source_url: "https://example.com/mock/catalog",
  latest_scraped_at: "2026-06-30T08:00:00.000Z",
  hero_image_url: MOCK_IMAGES[0] ?? null,
  gallery_image_urls: MOCK_IMAGES,
  short_description: "Mock produkt pro lokální vývoj při nedostupném API.",
  supplementary_parameters: [
    { name: "Typ hry", value: "Rodinná hra" },
    { name: "Počet hráčů", value: "2-5" },
    { name: "Doba hraní", value: "30-45 minut" },
    { name: "Minimální věk", value: "8+" },
  ],
  metadata: { seller: "tlamagames", mock: true },
  price_points: MOCK_PRICE_POINTS,
  category_tags: MOCK_CATEGORY_TAGS,
  genre_tags: ["Rodinná"],
  game_type_tags: ["Karetní hra"],
  mechanic_tags: ["Sběr sad"],
  availability_status: "available",
  min_age: 8,
  min_players: 2,
  max_players: 5,
  min_playtime_minutes: 30,
  max_playtime_minutes: 45,
  manufacturer: "Lokální mock",
  price_movement: "decreased",
  boardgamegeek_rating: null,
  is_available: true,
  is_preorder: false,
  primary_seller: "tlamagames",
};

export const MOCK_CATALOG_SEARCH_ROW: CatalogSearchRow = {
  product_code: MOCK_CATALOG_ROW.product_code,
  product_name: MOCK_CATALOG_ROW.product_name,
  product_name_normalized: MOCK_CATALOG_ROW.product_name_normalized,
  product_name_search: MOCK_CATALOG_ROW.product_name_search,
  currency_code: MOCK_CATALOG_ROW.currency_code,
  availability_label: MOCK_CATALOG_ROW.availability_label,
  latest_price: MOCK_CATALOG_ROW.latest_price,
  hero_image_url: MOCK_CATALOG_ROW.hero_image_url,
  gallery_image_urls: MOCK_CATALOG_ROW.gallery_image_urls,
  category_tags: MOCK_CATALOG_ROW.category_tags,
};
