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
  getMarkupTiers,
  vendorPriceBoundFromClient,
} from "@/lib/pricing/markup";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { FALLBACK_PRODUCTS } from "@/lib/data/products-fallback";
import { isAfterDarkCatalogProduct } from "@/lib/after-dark/catalog";
import { findSimilarProducts } from "@/lib/ai/similarity";
import {
  expandSearchQuery,
  matchesProductSearch,
} from "@/lib/products/catalog-attributes";

const DEFAULT_PAGE_SIZE = 12;

function applyFiltersLocally(
  products: Product[],
  filters: ProductFilters = {},
): Product[] {
  let result = [...products];

  if (filters.search) {
    result = result.filter((p) => matchesProductSearch(p, filters.search!));
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
  const marked = await applyClientMarkupToProducts(FALLBACK_PRODUCTS);
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
      const terms = expandSearchQuery(filters.search);
      // Broad OR across catalog fields + keyword array; refine with fuzzy locally
      // when PostgREST returns a page that still needs typo tolerance.
      const clauses = terms.flatMap((term) => {
        const like = `%${term.replace(/[%_,]/g, "")}%`;
        return [
          `name.ilike.${like}`,
          `brand.ilike.${like}`,
          `description.ilike.${like}`,
          `product_type.ilike.${like}`,
          `master_category.ilike.${like}`,
          `color.ilike.${like}`,
          `condition.ilike.${like}`,
          `audience.ilike.${like}`,
        ];
      });
      // Prefer keyword overlap for exact synonym tokens when short enough for URL.
      for (const term of terms.slice(0, 6)) {
        const safe = term.replace(/[^a-z0-9-]/gi, "");
        if (safe) clauses.push(`search_keywords.cs.{${safe}}`);
      }
      if (clauses.length) {
        query = query.or(clauses.join(","));
      }
    }

    if (filters.brands?.length) {
      query = query.in("brand", filters.brands);
    }

    if (filters.minPrice != null && filters.minPrice > 0) {
      const tiers = await getMarkupTiers();
      query = query.gte(
        "price",
        vendorPriceBoundFromClient(filters.minPrice, tiers, "min"),
      );
    }

    if (filters.maxPrice != null) {
      const tiers = await getMarkupTiers();
      query = query.lte(
        "price",
        vendorPriceBoundFromClient(filters.maxPrice, tiers, "max"),
      );
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

    // Empty catalog is intentional after a wipe — do not resurrect seed fallbacks.
    if (!data || data.length === 0) {
      // Soft fallback: broader fetch + local fuzzy/synonym match for typos.
      if (filters.search) {
        const { data: pool } = await supabase
          .from("products")
          .select("*")
          .eq("status", "live")
          .order("created_at", { ascending: false })
          .limit(200);
        if (pool?.length) {
          const tiers = await getMarkupTiers();
          const marked = pool.map((row) =>
            applyClientMarkupToProduct(mapProductRow(row), tiers),
          );
          const filtered = applyFiltersLocally(marked, filters);
          const sorted = sortProducts(filtered, sort);
          return paginateProducts(sorted, page, pageSize);
        }
      }
      return {
        products: [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      };
    }

    const tiers = await getMarkupTiers();
    let products = data.map((row) =>
      applyClientMarkupToProduct(mapProductRow(row), tiers),
    );

    // Tighten DB-broad search with synonym + fuzzy local filter.
    if (filters.search) {
      products = products.filter((p) =>
        matchesProductSearch(p, filters.search!),
      );
    }

    const total =
      filters.search && products.length < (count ?? products.length)
        ? products.length
        : (count ?? products.length);

    return {
      products,
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
  const tiers = await getMarkupTiers();

  if (!isConfigured) {
    const product = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return product ? applyClientMarkupToProduct(product, tiers) : null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "live")
      .maybeSingle();

    if (error) {
      console.error("getProductBySlug:", error.message);
      return null;
    }
    if (!data) return null;

    return applyClientMarkupToProduct(mapProductRow(data), tiers);
  } catch {
    return null;
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
    const filtered = await applyClientMarkupToProducts(
      FALLBACK_PRODUCTS.filter(isAfterDarkCatalogProduct),
    );
    const sorted = sortProducts(filtered, sort);
    return paginateProducts(sorted, page, pageSize);
  }

  return getProducts({
    ...params,
    filters: { collections: ["after-dark"] },
    page,
    pageSize,
    sort,
  });
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

    if (error) {
      console.error("getProductsBySlugs:", error.message);
      return [];
    }

    const tiers = await getMarkupTiers();
    const bySlug = new Map(
      (data ?? []).map((row) => [
        String(row.slug),
        applyClientMarkupToProduct(mapProductRow(row), tiers),
      ]),
    );
    return unique
      .map((slug) => bySlug.get(slug))
      .filter((p): p is Product => p != null);
  } catch {
    return [];
  }
}
