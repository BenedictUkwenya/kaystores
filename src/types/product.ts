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
  created_at: string;
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
    in_stock: Boolean(row.in_stock ?? true),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}
