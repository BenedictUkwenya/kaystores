import type { CatalogSegment } from "@/lib/pricing/config";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  maxStock?: number;
  vendorId?: string | null;
  /** Gifting vs After Dark — drives MOV and curation fee % */
  segment: CatalogSegment;
  /** @deprecated Prefer variationOptionLabel */
  size?: string;
  variationLabel?: string;
  variationOptionId?: string;
  variationOptionLabel?: string;
};

export type CartState = {
  items: CartItem[];
};
