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
  supplementary_parameters?: Record<string, unknown> | unknown[] | string | null;
  metadata?: Record<string, unknown> | null;
  seller?: string | null;
}

export interface ProductCatalogIndexRow {
  product_code: string | null;
  product_name?: string | null;
  product_name_original?: string | null;
  product_name_normalized?: string | null;
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
}

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
}

export interface SupplementaryParameter {
  name: string;
  value: string;
}

export type ProductFetcher = () => Promise<ProductRow[]>;

export interface DiscountEntry {
  productSlug: string;
  productName: string;
  currency?: string | null;
  url?: string | null;
  previousPrice: number;
  currentPrice: number;
  changedAt: string;
}
