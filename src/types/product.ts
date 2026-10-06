import {
  normalizeVariation,
  variationTotalStock,
  type ProductVariation,
  type ProductVariationOption,
} from "@/lib/products/variations";
import type { CatalogSegment } from "@/lib/pricing/config";

export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  specs: Record<string, string>;
  occasions: string[];
  recipients: string[];
  collections: string[];
  tags: string[];
  in_stock: boolean;
  stock_quantity: number;
  created_at: string;
  vendor_id?: string | null;
  status?: string;
  /** `products.segment` — the single source of truth for After Dark. */
  segment?: CatalogSegment;
  rejection_reason?: string | null;
  shipping_weight_kg?: number | null;
  shipping_length_cm?: number | null;
  shipping_width_cm?: number | null;
  shipping_height_cm?: number | null;
  product_type?: string | null;
  master_category?: string | null;
  color?: string | null;
  condition?: string | null;
  audience?: string | null;
  search_keywords?: string[];
  /** Independent of display/list price — used for vendor payouts. */
  vendor_original_price?: number | null;
  /** @deprecated Prefer `variation` — kept for older rows. */
  size_options?: string[];
  /** One customizable variation axis (Size / Length / Storage / …). */
  variation?: ProductVariation | null;
};

export type { ProductVariation, ProductVariationOption };

export type ProductSort =
  | "random"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export type ProductFilters = {
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  occasions?: string[];
  recipients?: string[];
  collections?: string[];
  tags?: string[];
  /** Hide products in any of these collections (e.g. Kay Kitchen on /gifts). */
  excludeCollections?: string[];
  /** Match any of these `product_type` values (e.g. Watch, Perfume). */
  productTypes?: string[];
  search?: string;
};

/**
 * Which catalogue segment to read. Defaults to `gifting` so After Dark never
 * leaks into the general store; pass `after_dark` only on age-gated surfaces.
 */
export type ProductSegmentScope = CatalogSegment | "all";

export type GetProductsParams = {
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  segment?: ProductSegmentScope;
  /** Seed for `random` sort — same seed gives the same order across pages. */
  seed?: string;
};

export type ProductsResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function mapProductRow(row: Record<string, unknown>): Product {
  const sizeOptions = Array.isArray(row.size_options)
    ? (row.size_options as string[])
    : [];
  const stockQuantity =
    row.stock_quantity != null
      ? Number(row.stock_quantity)
      : Boolean(row.in_stock ?? true)
        ? 1
        : 0;
  const variation = normalizeVariation(row.variation, sizeOptions, stockQuantity);
  const variationStock = variationTotalStock(variation);
  const effectiveStock =
    variationStock != null ? variationStock : stockQuantity;

  return {
    id: String(row.id),
    sku: String(row.sku),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    brand: String(row.brand ?? ""),
    price: Number(row.price),
    compare_at_price:
      row.compare_at_price != null ? Number(row.compare_at_price) : null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    specs:
      row.specs && typeof row.specs === "object"
        ? (row.specs as Record<string, string>)
        : {},
    occasions: Array.isArray(row.occasions) ? (row.occasions as string[]) : [],
    recipients: Array.isArray(row.recipients)
      ? (row.recipients as string[])
      : [],
    collections: Array.isArray(row.collections)
      ? (row.collections as string[])
      : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    stock_quantity: effectiveStock,
    in_stock: effectiveStock > 0,
    created_at: String(row.created_at ?? new Date().toISOString()),
    vendor_id: row.vendor_id != null ? String(row.vendor_id) : null,
    status: row.status != null ? String(row.status) : undefined,
    segment:
      row.segment === "after_dark" || row.segment === "gifting"
        ? row.segment
        : undefined,
    rejection_reason:
      row.rejection_reason != null ? String(row.rejection_reason) : null,
    shipping_weight_kg:
      row.shipping_weight_kg != null ? Number(row.shipping_weight_kg) : null,
    shipping_length_cm:
      row.shipping_length_cm != null ? Number(row.shipping_length_cm) : null,
    shipping_width_cm:
      row.shipping_width_cm != null ? Number(row.shipping_width_cm) : null,
    shipping_height_cm:
      row.shipping_height_cm != null ? Number(row.shipping_height_cm) : null,
    product_type: row.product_type != null ? String(row.product_type) : null,
    master_category:
      row.master_category != null ? String(row.master_category) : null,
    color: row.color != null ? String(row.color) : null,
    condition: row.condition != null ? String(row.condition) : null,
    audience: row.audience != null ? String(row.audience) : null,
    search_keywords: Array.isArray(row.search_keywords)
      ? (row.search_keywords as string[])
      : [],
    vendor_original_price:
      row.vendor_original_price != null
        ? Number(row.vendor_original_price)
        : null,
    size_options: sizeOptions,
    variation,
  };
}
