export interface ProductRow {
  id: number;
  product_code: string | null;
  product_name_original: string | null;
  product_name_normalized: string | null;
  price_with_vat: number | null;
  list_price_with_vat: number | null;
  currency_code: string | null;
  source_url: string | null;
  availability_label: string | null;
  stock_status_label: string | null;
  hero_image_url: string | null;
  gallery_image_urls?: string[] | string | null;
  short_description: string | null;
  scraped_at: string;
  price_date?: string | null;
  snapshot_count?: number | null;
  supplementary_parameters?: Record<string, unknown> | unknown[] | string | null;
  metadata?: Record<string, unknown> | null;
  seller?: string | null;
  latest_price?: number | null;
  previous_price?: number | null;
  first_price?: number | null;
  latest_scraped_at?: string | null;
}

export interface ProductCatalogIndexRow {
  product_code: string | null;
  product_name?: string | null;
  product_name_original?: string | null;
  product_name_normalized?: string | null;
  product_name_search?: string | null;
  currency_code: string | null;
  availability_label: string | null;
  stock_status_label: string | null;
  latest_price: number | null;
  previous_price: number | null;
  first_price: number | null;
  list_price_with_vat: number | null;
  source_url: string | null;
  latest_scraped_at: string | null;
  hero_image_url: string | null;
  gallery_image_urls?: string[] | string | null;
  short_description: string | null;
  supplementary_parameters?: Record<string, unknown> | unknown[] | string | null;
  metadata?: Record<string, unknown> | null;
  price_points?: Array<Record<string, unknown>> | null;
  category_tags?: string[] | null;
  genre_tags?: string[] | null;
  game_type_tags?: string[] | null;
  mechanic_tags?: string[] | null;
  availability_status?: string | null;
  min_age?: number | null;
  min_players?: number | null;
  max_players?: number | null;
  min_playtime_minutes?: number | null;
  max_playtime_minutes?: number | null;
  manufacturer?: string | null;
  price_movement?: string | null;
  boardgamegeek_rating?: number | null;
  is_available?: boolean | null;
  is_preorder?: boolean | null;
  primary_seller?: string | null;
  seller_count?: number | null;
}

export type CatalogSearchRow = Pick<
  ProductCatalogIndexRow,
  | "product_code"
  | "product_name"
  | "product_name_normalized"
  | "product_name_search"
  | "currency_code"
  | "availability_label"
  | "latest_price"
  | "hero_image_url"
  | "gallery_image_urls"
  | "seller_count"
  | "category_tags"
>;

export interface ProductPoint {
  rawDate: string;
  price: number;
}

export interface SellerSeries {
  seller: string;
  productCode: string | null;
  label: string;
  currency?: string | null;
  url?: string | null;
  listPrice: number | null;
  heroImage?: string | null;
  availabilityLabel?: string | null;
  shortDescription?: string | null;
  galleryImages?: string[];
  supplementaryParameters: SupplementaryParameter[];
  categoryTags: string[];
  points: ProductPoint[];
  latestPrice: number | null;
  firstPrice: number | null;
  previousPrice: number | null;
  latestScrapedAt: string | null;
}

export interface ProductSeries {
  slug: string;
  primaryProductCode: string | null;
  label: string;
  currency?: string | null;
  url?: string | null;
  listPrice: number | null;
  heroImage?: string | null;
  availabilityLabel?: string | null;
  shortDescription?: string | null;
  galleryImages?: string[];
  supplementaryParameters: SupplementaryParameter[];
  categoryTags: string[];
  points: ProductPoint[];
  latestPrice: number | null;
  firstPrice: number | null;
  previousPrice: number | null;
  latestScrapedAt: string | null;
  sellers: SellerSeries[];
  primarySeller: string | null;
  sellerCount?: number | null;
}

export interface ProductSearchResult {
  slug: string;
  label: string;
  primaryProductCode: string | null;
  heroImage?: string | null;
  galleryImages?: string[];
  categoryTags: string[];
  sellerCount?: number | null;
  availabilityLabel?: string | null;
  latestPrice: number | null;
  currency?: string | null;
}

export interface SupplementaryParameter {
  name: string;
  value: string;
}

export type ProductFetcher = (signal?: AbortSignal) => Promise<ProductRow[]>;

export interface PriceRangeResponse {
  min_price: number | null;
  max_price: number | null;
}
