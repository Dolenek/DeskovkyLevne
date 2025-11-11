export interface ProductRow {
  id: number;
  product_code: string;
  product_name: string | null;
  price_with_vat: number | null;
  list_price_with_vat: number | null;
  currency_code: string | null;
  source_url: string | null;
  availability_label: string | null;
  hero_image_url: string | null;
  gallery_image_urls?: string[] | string | null;
  scraped_at: string;
}

export interface ProductPoint {
  rawDate: string;
  price: number;
}

export interface ProductSeries {
  productCode: string;
  label: string;
  currency?: string | null;
  url?: string | null;
  listPrice: number | null;
  heroImage?: string | null;
  availabilityLabel?: string | null;
  galleryImages?: string[];
  points: ProductPoint[];
  latestPrice: number | null;
  firstPrice: number | null;
  previousPrice: number | null;
  latestScrapedAt: string | null;
}

export type ProductFetcher = () => Promise<ProductRow[]>;

export interface DiscountEntry {
  productCode: string;
  productName: string;
  currency?: string | null;
  url?: string | null;
  previousPrice: number;
  currentPrice: number;
  changedAt: string;
}
