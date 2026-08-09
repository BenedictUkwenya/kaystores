import { createAdminClient } from "@/lib/supabase/admin";
import type { MarkupTier } from "@/types/pricing";
import {
  invalidateMarkupCache,
  applyClientMarkup,
} from "@/lib/pricing/markup";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("Admin client not configured");
  return client;
}

function mapRow(row: Record<string, unknown>): MarkupTier {
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

export type MarkupTierInput = {
  minPrice: number;
  maxPrice: number | null;
  ratePercent: number;
  flatFee: number;
  label?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function rangesOverlap(
  a: { minPrice: number; maxPrice: number | null },
  b: { minPrice: number; maxPrice: number | null },
): boolean {
  const aMax = a.maxPrice ?? Number.POSITIVE_INFINITY;
  const bMax = b.maxPrice ?? Number.POSITIVE_INFINITY;
  return a.minPrice <= bMax && b.minPrice <= aMax;
}

export async function fetchMarkupTiersAdmin(): Promise<MarkupTier[]> {
  const db = admin();
  const { data, error } = await db
    .from("pricing_markup_tiers")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("min_price", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

async function assertNoOverlap(
  candidate: { minPrice: number; maxPrice: number | null; active: boolean },
  excludeId?: string,
): Promise<void> {
  if (!candidate.active) return;

  const existing = await fetchMarkupTiersAdmin();
  for (const tier of existing) {
    if (!tier.active) continue;
    if (excludeId && tier.id === excludeId) continue;
    if (rangesOverlap(candidate, tier)) {
      throw new Error(
        `Overlaps active tier ${tier.label ?? tier.id} (₦${tier.minPrice.toLocaleString()}–${tier.maxPrice == null ? "∞" : `₦${tier.maxPrice.toLocaleString()}`}).`,
      );
    }
  }
}

export async function createMarkupTier(
  input: MarkupTierInput,
): Promise<MarkupTier> {
  const minPrice = Math.max(0, Math.floor(input.minPrice));
  const maxPrice =
    input.maxPrice == null ? null : Math.max(minPrice, Math.floor(input.maxPrice));
  const rate = Math.max(0, input.ratePercent) / 100;
  const flatFee = Math.max(0, Math.floor(input.flatFee));
  const active = input.active !== false;

  await assertNoOverlap({ minPrice, maxPrice, active });

  const db = admin();
  const { data, error } = await db
    .from("pricing_markup_tiers")
    .insert({
      min_price: minPrice,
      max_price: maxPrice,
      rate,
      flat_fee: flatFee,
      label: input.label?.trim() || null,
      sort_order: input.sortOrder ?? 0,
      active,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create tier");
  invalidateMarkupCache();
  return mapRow(data as Record<string, unknown>);
}

export async function updateMarkupTier(
  id: string,
  input: Partial<MarkupTierInput>,
): Promise<MarkupTier> {
  const existing = await fetchMarkupTiersAdmin();
  const current = existing.find((t) => t.id === id);
  if (!current) throw new Error("Tier not found");

  const minPrice =
    input.minPrice != null
      ? Math.max(0, Math.floor(input.minPrice))
      : current.minPrice;
  const maxPrice =
    input.maxPrice === undefined
      ? current.maxPrice
      : input.maxPrice == null
        ? null
        : Math.max(minPrice, Math.floor(input.maxPrice));
  const rate =
    input.ratePercent != null
      ? Math.max(0, input.ratePercent) / 100
      : current.rate;
  const flatFee =
    input.flatFee != null
      ? Math.max(0, Math.floor(input.flatFee))
      : current.flatFee;
  const active = input.active ?? current.active;

  await assertNoOverlap({ minPrice, maxPrice, active }, id);

  const db = admin();
  const { data, error } = await db
    .from("pricing_markup_tiers")
    .update({
      min_price: minPrice,
      max_price: maxPrice,
      rate,
      flat_fee: flatFee,
      label:
        input.label === undefined
          ? current.label
          : input.label?.trim() || null,
      sort_order: input.sortOrder ?? current.sortOrder,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update tier");
  invalidateMarkupCache();
  return mapRow(data as Record<string, unknown>);
}

export async function deleteMarkupTier(id: string): Promise<void> {
  const db = admin();
  const { error } = await db.from("pricing_markup_tiers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  invalidateMarkupCache();
}

export function previewCustomerPrice(
  vendorPrice: number,
  tiers: MarkupTier[],
): number {
  const active = tiers.filter((t) => t.active);
  return applyClientMarkup(vendorPrice, active.length ? active : tiers);
}
