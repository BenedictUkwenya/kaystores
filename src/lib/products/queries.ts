import type {
  GetProductsParams,
  Product,
  ProductFilters,
  ProductSegmentScope,
  ProductsResult,
} from "@/types/product";
import { mapProductRow } from "@/types/product";
import {
  applyClientMarkupToProduct,
  applyClientMarkupToProducts,
  getMarkupTiers,
  vendorPriceBoundFromClient,
} from "@/lib/pricing/markup";
import { getProductSegment } from "@/lib/pricing/segment";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { FALLBACK_PRODUCTS } from "@/lib/data/products-fallback";
import { findSimilarProducts } from "@/lib/ai/similarity";
import {
  expandSearchQuery,
  matchesProductSearch,
} from "@/lib/products/catalog-attributes";
import {
  dailyShuffleSeed,
  randomShuffleSeed,
  seededShuffle,
} from "@/lib/products/shuffle";

const DEFAULT_PAGE_SIZE = 12;
/** Pool size for random discovery so more of the catalogue gets shown. */
const RANDOM_POOL_SIZE = 500;
const BRAND_SCAN_LIMIT = 2000;

type ProductsQuery = ReturnType<
  Awaited<ReturnType<typeof createClient>>["from"]
>;

function matchesSegmentScope(
  product: Product,
  scope: ProductSegmentScope,
): boolean {
  if (scope === "all") return true;
  return getProductSegment(product) === scope;
}

/** `segment` is NOT NULL (default 'gifting') — see migration 006. */
function applySegmentScope<Q extends { eq: (col: string, val: string) => Q }>(
  query: Q,
  scope: ProductSegmentScope,
): Q {
  if (scope === "all") return query;
  return query.eq("segment", scope);
}

function toPgArrayLiteral(values: string[]): string {
  return `{${values.map((v) => `"${v.replace(/["\\]/g, "")}"`).join(",")}}`;
}

function applyFiltersLocally(
  products: Product[],
  filters: ProductFilters = {},
  scope: ProductSegmentScope = "gifting",
): Product[] {
  let result = products.filter((p) => matchesSegmentScope(p, scope));

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

  if (filters.excludeCollections?.length) {
    result = result.filter(
      (p) => !filters.excludeCollections!.some((c) => p.collections.includes(c)),
    );
  }

  if (filters.tags?.length) {
    result = result.filter((p) =>
      filters.tags!.some((t) => p.tags.includes(t)),
    );
  }

  return result;
}

function sortProducts(
  products: Product[],
  sort: GetProductsParams["sort"],
  seed: string,
) {
  const sorted = [...products];
  switch (sort) {
    case "random":
      return seededShuffle(
        sorted.sort((a, b) => a.id.localeCompare(b.id)),
        seed,
      );
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
  const filtered = applyFiltersLocally(
    marked,
    params.filters ?? {},
    params.segment ?? "gifting",
  );
  const sorted = sortProducts(
    filtered,
    params.sort ?? "random",
    params.seed ?? dailyShuffleSeed(),
  );
  return paginateProducts(sorted, page, pageSize);
}

export async function getProducts(
  params: GetProductsParams = {},
): Promise<ProductsResult> {
  const { isConfigured } = getSupabaseConfig();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? "random";
  const filters = params.filters ?? {};
  const scope = params.segment ?? "gifting";
  const seed = params.seed ?? dailyShuffleSeed();

  if (!isConfigured) {
    return getProductsFromFallback(params);
  }

  try {
    const supabase = await createClient();
    let query = applySegmentScope(
      supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("status", "live"),
      scope,
    );

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

    // Multi-select = match any selected value (array overlap).
    if (filters.occasions?.length) {
      query = query.overlaps("occasions", filters.occasions);
    }

    if (filters.recipients?.length) {
      query = query.overlaps("recipients", filters.recipients);
    }

    if (filters.collections?.length) {
      query = query.overlaps("collections", filters.collections);
    }

    if (filters.excludeCollections?.length) {
      query = query.not(
        "collections",
        "ov",
        toPgArrayLiteral(filters.excludeCollections),
      );
    }

    if (filters.tags?.length) {
      query = query.overlaps("tags", filters.tags);
    }

    // Random: pull a pool, shuffle with a stable seed, then paginate locally so
    // page 2 continues page 1 instead of reshuffling into repeats.
    if (sort === "random") {
      query = query
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .limit(RANDOM_POOL_SIZE);
      const { data, error, count } = await query;

      if (error) {
        console.error("getProducts:", error.message);
        return getProductsFromFallback(params);
      }

      if (!data || data.length === 0) {
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

      if (filters.search) {
        products = products.filter((p) =>
          matchesProductSearch(p, filters.search!),
        );
      }

      return paginateProducts(sortProducts(products, "random", seed), page, pageSize);
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
    query = query.order("id", { ascending: true });

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
        const { data: pool } = await applySegmentScope(
          supabase.from("products").select("*").eq("status", "live"),
          scope,
        )
          .order("created_at", { ascending: false })
          .limit(200);
        if (pool?.length) {
          const tiers = await getMarkupTiers();
          const marked = pool.map((row) =>
            applyClientMarkupToProduct(mapProductRow(row), tiers),
          );
          const filtered = applyFiltersLocally(marked, filters, scope);
          const sorted = sortProducts(filtered, sort, seed);
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

/**
 * Looks up any live product regardless of segment. Callers rendering After
 * Dark products must check `isAfterDarkProduct` and enforce the age gate.
 */
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

/** Related picks stay inside the anchor's segment (After Dark ↔ After Dark). */
export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const segment = getProductSegment(product);
  const { products: catalog } = await getProducts({
    pageSize: 100,
    segment,
    sort: "newest",
  });
  const { products } = await findSimilarProducts(product, catalog, limit);
  return products;
}

export async function getDistinctBrands(
  segment: ProductSegmentScope = "gifting",
): Promise<string[]> {
  const { isConfigured } = getSupabaseConfig();

  const fromProducts = (products: Product[]) =>
    [
      ...new Set(
        products
          .filter((p) => matchesSegmentScope(p, segment))
          .map((p) => p.brand.trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));

  if (!isConfigured) return fromProducts(FALLBACK_PRODUCTS);

  try {
    const supabase = await createClient();
    let brandQuery = supabase
      .from("products")
      .select("brand")
      .eq("status", "live");
    if (segment !== "all") {
      brandQuery = brandQuery.eq("segment", segment);
    }
    const { data, error } = await brandQuery
      .not("brand", "is", null)
      .order("brand", { ascending: true })
      .limit(BRAND_SCAN_LIMIT);

    if (error) {
      console.error("getDistinctBrands:", error.message);
      return [];
    }

    return [
      ...new Set(
        (data ?? [])
          .map((row) => String((row as { brand?: unknown }).brand ?? "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export async function getCuratedProducts(limit = 5): Promise<Product[]> {
  const poolSize = Math.min(RANDOM_POOL_SIZE, Math.max(limit * 8, 40));
  const { products } = await getProducts({
    sort: "random",
    pageSize: poolSize,
    // Single-page surface — a fresh seed per visit keeps the home page lively.
    seed: randomShuffleSeed(),
  });
  return products.slice(0, limit);
}

/** Age-gated surfaces only — callers must verify the After Dark age cookie. */
export async function getAfterDarkProducts(
  params: Omit<GetProductsParams, "segment"> = {},
): Promise<ProductsResult> {
  return getProducts({
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 24,
    sort: params.sort ?? "random",
    segment: "after_dark",
  });
}

export async function getTableProducts(
  params: Omit<GetProductsParams, "filters"> & {
    filters?: Omit<ProductFilters, "collections"> & { tags?: string[] };
  } = {},
): Promise<ProductsResult> {
  const { isConfigured } = getSupabaseConfig();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;
  const sort = params.sort ?? "random";
  const tagFilters = params.filters?.tags;

  if (!isConfigured) {
    const { isTableCatalogProduct } = await import("@/lib/table/catalog");
    let filtered = await applyClientMarkupToProducts(
      FALLBACK_PRODUCTS.filter(isTableCatalogProduct),
    );
    if (tagFilters?.length) {
      filtered = filtered.filter((p) =>
        tagFilters.some((t) => p.tags.includes(t)),
      );
    }
    const sorted = sortProducts(filtered, sort, params.seed ?? dailyShuffleSeed());
    return paginateProducts(sorted, page, pageSize);
  }

  return getProducts({
    ...params,
    filters: {
      ...params.filters,
      collections: ["table"],
      tags: tagFilters,
    },
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
