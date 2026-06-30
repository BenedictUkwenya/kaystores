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
  segment?: string;
  rejection_reason?: string | null;
};

export type ProductSort =
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
  search?: string;
};

export type GetProductsParams = {
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export type ProductsResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function mapProductRow(row: Record<string, unknown>): Product {
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
    stock_quantity:
      row.stock_quantity != null
        ? Number(row.stock_quantity)
        : Boolean(row.in_stock ?? true)
          ? 1
          : 0,
    in_stock:
      row.stock_quantity != null
        ? Number(row.stock_quantity) > 0
        : Boolean(row.in_stock ?? true),
    created_at: String(row.created_at ?? new Date().toISOString()),
    vendor_id: row.vendor_id != null ? String(row.vendor_id) : null,
    status: row.status != null ? String(row.status) : undefined,
    segment: row.segment != null ? String(row.segment) : undefined,
    rejection_reason:
      row.rejection_reason != null ? String(row.rejection_reason) : null,
  };
}
