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
};

export type CartState = {
  items: CartItem[];
};
