import { createAdminClient } from "@/lib/supabase/admin";
import { applyClientMarkupToProducts } from "@/lib/pricing/markup";
import { mapProductRow, type Product } from "@/types/product";

export type FeaturedSlot = {
  id: string;
  productId: string;
  productName: string;
  amountNgn: number;
  startsAt: string;
  endsAt: string;
  note: string;
};

function lagosToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

export async function listFeaturedSlots(): Promise<FeaturedSlot[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("ai_featured_slots")
    .select("id, product_id, amount_ngn, starts_at, ends_at, note, products(name)")
    .order("starts_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => {
    const product = row.products as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(product) ? product[0]?.name : product?.name;
    return {
      id: String(row.id),
      productId: String(row.product_id),
      productName: name ? String(name) : "Product",
      amountNgn: Number(row.amount_ngn),
      startsAt: String(row.starts_at),
      endsAt: String(row.ends_at),
      note: String(row.note ?? ""),
    };
  });
}

export async function listActiveFeaturedProducts(): Promise<Product[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const today = lagosToday();
  const { data, error } = await admin
    .from("ai_featured_slots")
    .select("product_id")
    .lte("starts_at", today)
    .gte("ends_at", today);
  if (error || !data?.length) return [];
  const ids = [...new Set(data.map((row) => String(row.product_id)))];
  const { data: rows } = await admin.from("products").select("*").in("id", ids).eq("status", "live");
  if (!rows?.length) return [];
  return applyClientMarkupToProducts(rows.map((row) => mapProductRow(row)));
}

export async function createFeaturedSlot(input: {
  productId: string;
  amountNgn: number;
  startsAt: string;
  endsAt: string;
  note?: string;
}): Promise<{ id: string } | { error: string }> {
  const admin = createAdminClient();
  if (!admin) return { error: "Database is not configured." };
  const { data, error } = await admin
    .from("ai_featured_slots")
    .insert({
      product_id: input.productId,
      amount_ngn: input.amountNgn,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      note: input.note?.trim() ?? "",
    })
    .select("id")
    .single();
  if (error || !data) {
    return {
      error:
        error?.message ??
        "Could not save the slot. Run migration 046_ai_featured_slots.sql if this table is missing.",
    };
  }
  return { id: String(data.id) };
}

export async function deleteFeaturedSlot(id: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("ai_featured_slots").delete().eq("id", id);
}
