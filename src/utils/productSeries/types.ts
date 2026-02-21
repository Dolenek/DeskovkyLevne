import type { ProductSeries, SupplementaryParameter } from "../../types/product";

export interface SellerDraft {
  slug: string;
  sellerId: string;
  productCode: string | null;
  label: string;
  currency?: string | null;
  url?: string | null;
  listPrice: number | null;
  heroImage?: string | null;
  availabilityLabel?: string | null;
  availabilityRecordedAt: number | null;
  shortDescription?: string | null;
  galleryImages?: string[];
  supplementaryParameters: SupplementaryParameter[];
  supplementaryRecordedAt: number | null;
  categoryTags: string[];
  points: ProductSeries["points"];
}

export interface ProductDraft {
  slug: string;
  label: string;
  sellers: Map<string, SellerDraft>;
}

export const SELLER_PRIORITY = ["tlamagames", "tlamagase", "planetaher"];
