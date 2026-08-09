import type { Product } from "@/types/product";
import type { MarkupTier } from "@/types/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

export type { MarkupTier };

/** Fallback when no tiers are loaded (matches legacy flat 15%). */
export const CLIENT_MARKUP_RATE = 0.15;

const CACHE_TTL_MS = 45_000;

let cache: { tiers: MarkupTier[]; loadedAt: number } | null = null;

export function invalidateMarkupCache(): void {
  cache = null;
}

function mapTierRow(row: Record<string, unknown>): MarkupTier {
  return {
    id: String(row.id),
    minPrice: Number(row.min_price ?? 0),
    maxPrice: row.max_price == null ? null : Number(row.max_price),
    rate: Number(row.rate ?? 0),
    flatFee: Number(row.flat_fee ?? 0),
    label: row.label != null ? String(row.label) : null,
    sortOrder: Number(row.sort_order ?? 0),
    active: row.active !== false,
  };
}

const FALLBACK_TIERS: MarkupTier[] = [
  {
    id: "fallback",
    minPrice: 0,
    maxPrice: null,
    rate: CLIENT_MARKUP_RATE,
    flatFee: 0,
    label: "Default",
    sortOrder: 0,
    active: true,
  },
];

export async function getMarkupTiers(): Promise<MarkupTier[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.tiers;
  }

  const admin = createAdminClient();
  if (!admin) {
    cache = { tiers: FALLBACK_TIERS, loadedAt: Date.now() };
    return FALLBACK_TIERS;
  }

  const { data, error } = await admin
    .from("pricing_markup_tiers")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("min_price", { ascending: true });

  if (error) {
    console.error("[markup] failed to load tiers:", error.message);
    cache = { tiers: FALLBACK_TIERS, loadedAt: Date.now() };
    return FALLBACK_TIERS;
  }

  const tiers = (data ?? []).map((row) =>
    mapTierRow(row as Record<string, unknown>),
  );
  const resolved = tiers.length > 0 ? tiers : FALLBACK_TIERS;
  cache = { tiers: resolved, loadedAt: Date.now() };
  return resolved;
}

export function resolveMarkupTier(
  vendorPrice: number,
  tiers: MarkupTier[],
): MarkupTier {
  const price = Math.max(0, vendorPrice);
  const match = tiers.find((tier) => {
    if (price < tier.minPrice) return false;
    if (tier.maxPrice != null && price > tier.maxPrice) return false;
    return true;
  });
  return match ?? tiers[tiers.length - 1] ?? FALLBACK_TIERS[0];
}

export function applyClientMarkup(
  vendorPrice: number,
  tiers?: MarkupTier[],
): number {
  if (vendorPrice <= 0) return 0;
  const tier = resolveMarkupTier(
    vendorPrice,
    tiers?.length ? tiers : cache?.tiers ?? FALLBACK_TIERS,
  );
  return Math.round(vendorPrice * (1 + tier.rate) + tier.flatFee);
}

/**
 * Convert a client-facing filter bound to a vendor list-price bound.
 * Uses the most permissive inverse across tiers so DB filters don't drop
 * edge products; local filters still apply after markup.
 */
export function vendorPriceBoundFromClient(
  clientPrice: number,
  tiers?: MarkupTier[],
  mode: "min" | "max" = "min",
): number {
  if (clientPrice <= 0) return 0;
  const list = tiers?.length ? tiers : cache?.tiers ?? FALLBACK_TIERS;
  const estimates: number[] = [];

  for (const tier of list) {
    const denom = 1 + tier.rate;
    if (denom <= 0) continue;
    let est = (clientPrice - tier.flatFee) / denom;
    if (!Number.isFinite(est)) continue;
    const upper = tier.maxPrice ?? Number.POSITIVE_INFINITY;
    est = Math.min(Math.max(est, tier.minPrice), upper);
    estimates.push(est);
  }

  if (estimates.length === 0) {
    return Math.floor(clientPrice / (1 + CLIENT_MARKUP_RATE));
  }

  return mode === "max"
    ? Math.ceil(Math.max(...estimates))
    : Math.floor(Math.min(...estimates));
}

export function applyClientMarkupToProduct(
  product: Product,
  tiers?: MarkupTier[],
): Product {
  const price = applyClientMarkup(product.price, tiers);
  const compare_at_price =
    product.compare_at_price != null
      ? applyClientMarkup(product.compare_at_price, tiers)
      : null;

  return {
    ...product,
    price,
    compare_at_price:
      compare_at_price != null && compare_at_price > price
        ? compare_at_price
        : compare_at_price,
  };
}

export async function applyClientMarkupToProducts(
  products: Product[],
): Promise<Product[]> {
  const tiers = await getMarkupTiers();
  return products.map((p) => applyClientMarkupToProduct(p, tiers));
}

export async function markupPrice(vendorPrice: number): Promise<number> {
  const tiers = await getMarkupTiers();
  return applyClientMarkup(vendorPrice, tiers);
}
