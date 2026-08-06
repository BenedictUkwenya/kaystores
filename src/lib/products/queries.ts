import type {
  GetProductsParams,
  Product,
  ProductFilters,
  ProductsResult,
} from "@/types/product";
import { mapProductRow } from "@/types/product";
import {
  applyClientMarkupToProduct,
  applyClientMarkupToProducts,
  vendorPriceBoundFromClient,
} from "@/lib/pricing/markup";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { FALLBACK_PRODUCTS } from "@/lib/data/products-fallback";
import { isAfterDarkCatalogProduct } from "@/lib/after-dark/catalog";
import { findSimilarProducts } from "@/lib/ai/similarity";

const DEFAULT_PAGE_SIZE = 12;

function applyFiltersLocally(
  products: Product[],
  filters: ProductFilters = {},
): Product[] {
  let result = [...products];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  if (filters.brands?.length) {
    result = result.filter((p) => filters.brands!.includes(p.brand));
  }

  if (filters.minPrice != null) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice != null) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.occasions?.length) {
    result = result.filter((p) =>
      filters.occasions!.some((o) => p.occasions.includes(o)),
    );
  }

  if (filters.recipients?.length) {
    result = result.filter((p) =>
      filters.recipients!.some((r) => p.recipients.includes(r)),
    );
  }

  if (filters.collections?.length) {
    result = result.filter((p) =>
      filters.collections!.some((c) => p.collections.includes(c)),
    );
  }

  if (filters.tags?.length) {
    result = result.filter((p) =>
      filters.tags!.some((t) => p.tags.includes(t)),
    );
  }

  return result;
}

function sortProducts(products: Product[], sort: GetProductsParams["sort"]) {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
}

function paginateProducts(
  products: Product[],
  page: number,
  pageSize: number,
): ProductsResult {
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    products: products.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

async function getProductsFromFallback(
  params: GetProductsParams,
): Promise<ProductsResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const marked = applyClientMarkupToProducts(FALLBACK_PRODUCTS);
  const filtered = applyFiltersLocally(marked, params.filters ?? {});
  const sorted = sortProducts(filtered, params.sort ?? "newest");
  return paginateProducts(sorted, page, pageSize);
}

export async function getProducts(
  params: GetProductsParams = {},
): Promise<ProductsResult> {
  const { isConfigured } = getSupabaseConfig();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? "newest";
  const filters = params.filters ?? {};

  if (!isConfigured) {
    return getProductsFromFallback(params);
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("products").select("*", { count: "exact" }).eq("status", "live");

    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.or(
        `name.ilike.${q},brand.ilike.${q},description.ilike.${q}`,
      );
    }

    if (filters.brands?.length) {
      query = query.in("brand", filters.brands);
    }

    if (filters.minPrice != null && filters.minPrice > 0) {
      query = query.gte("price", vendorPriceBoundFromClient(filters.minPrice));
    }

    if (filters.maxPrice != null) {
      query = query.lte("price", vendorPriceBoundFromClient(filters.maxPrice));
    }

    if (filters.occasions?.length === 1) {
      query = query.contains("occasions", [filters.occasions[0]]);
    }

    if (filters.recipients?.length === 1) {
      query = query.contains("recipients", [filters.recipients[0]]);
    }

    if (filters.collections?.length === 1) {
      query = query.contains("collections", [filters.collections[0]]);
    }

    if (filters.tags?.length === 1) {
      query = query.contains("tags", [filters.tags[0]]);
    }

    switch (sort) {
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      case "name-asc":
        query = query.order("name", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("getProducts:", error.message);
      return getProductsFromFallback(params);
    }

    if (!data || data.length === 0) {
      const fallback = await getProductsFromFallback(params);
      if (fallback.total > 0) return fallback;
      return {
        products: [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      };
    }

    const total = count ?? data.length;
    return {
      products: data.map((row) =>
        applyClientMarkupToProduct(mapProductRow(row)),
      ),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch {
    return getProductsFromFallback(params);
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    const product = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return product ? applyClientMarkupToProduct(product) : null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "live")
      .maybeSingle();

    if (error || !data) {
      const product = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
      return product ? applyClientMarkupToProduct(product) : null;
    }

    return applyClientMarkupToProduct(mapProductRow(data));
  } catch {
    const product = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return product ? applyClientMarkupToProduct(product) : null;
  }
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const { products: catalog } = await getProducts({ pageSize: 100 });
  const { products } = await findSimilarProducts(product, catalog, limit);
  return products;
}

export async function getDistinctBrands(): Promise<string[]> {
  const { products } = await getProducts({ pageSize: 100 });
  return [...new Set(products.map((p) => p.brand))].sort();
}

export async function getCuratedProducts(limit = 5): Promise<Product[]> {
  const { products } = await getProducts({
    sort: "newest",
    pageSize: limit,
  });
  return products;
}

export async function getAfterDarkProducts(
  params: Omit<GetProductsParams, "filters"> = {},
): Promise<ProductsResult> {
  const { isConfigured } = getSupabaseConfig();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;
  const sort = params.sort ?? "newest";

  if (!isConfigured) {
    const filtered = FALLBACK_PRODUCTS.filter(isAfterDarkCatalogProduct);
    const sorted = sortProducts(filtered, sort);
    return paginateProducts(sorted, page, pageSize);
  }

  const result = await getProducts({
    ...params,
    filters: { collections: ["after-dark"] },
    page,
    pageSize,
    sort,
  });

  if (result.products.length === 0) {
    const filtered = FALLBACK_PRODUCTS.filter(isAfterDarkCatalogProduct);
    const sorted = sortProducts(filtered, sort);
    return paginateProducts(sorted, page, pageSize);
  }

  return result;
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];

  const unique = [...new Set(slugs)];
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return applyClientMarkupToProducts(
      unique
        .map((slug) => FALLBACK_PRODUCTS.find((p) => p.slug === slug))
        .filter((p): p is Product => p != null),
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("slug", unique)
      .eq("status", "live");

    if (error || !data?.length) {
      return unique
        .map((slug) => FALLBACK_PRODUCTS.find((p) => p.slug === slug))
        .filter((p): p is Product => p != null);
    }

    const bySlug = new Map(
      data.map((row) => [
        String(row.slug),
        applyClientMarkupToProduct(mapProductRow(row)),
      ]),
    );
    return unique
      .map((slug) => bySlug.get(slug) ?? FALLBACK_PRODUCTS.find((p) => p.slug === slug))
      .filter((p): p is Product => p != null)
      .map((p) => (bySlug.has(p.slug) ? p : applyClientMarkupToProduct(p)));
  } catch {
    return applyClientMarkupToProducts(
      unique
        .map((slug) => FALLBACK_PRODUCTS.find((p) => p.slug === slug))
        .filter((p): p is Product => p != null),
    );
  }
}
