import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GiftReveal } from "@/types/reveal";
import { PRE_SHIP_STATUSES } from "@/types/reveal";
import type { Order } from "@/types/order";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

function mapReveal(row: Record<string, unknown>): GiftReveal {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    token: String(row.token),
    note: row.note != null ? String(row.note) : null,
    videoPath: row.video_path != null ? String(row.video_path) : null,
    photoPath: row.photo_path != null ? String(row.photo_path) : null,
    openedAt: row.opened_at != null ? String(row.opened_at) : null,
    lockedAt: row.locked_at != null ? String(row.locked_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function generateRevealToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createGiftRevealForOrder(input: {
  orderId: string;
  note?: string | null;
}): Promise<GiftReveal> {
  const db = admin();
  const { data, error } = await db
    .from("gift_reveals")
    .insert({
      order_id: input.orderId,
      token: generateRevealToken(),
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapReveal(data);
}

export async function getRevealByOrderId(
  orderId: string,
): Promise<GiftReveal | null> {
  const db = admin();
  const { data, error } = await db
    .from("gift_reveals")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapReveal(data) : null;
}

export async function getRevealByToken(
  token: string,
): Promise<GiftReveal | null> {
  const db = admin();
  const { data, error } = await db
    .from("gift_reveals")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapReveal(data) : null;
}

export async function ensureGiftReveal(
  order: Order,
): Promise<GiftReveal | null> {
  if (order.deliveryType !== "gift") return null;
  const existing = await getRevealByOrderId(order.id);
  if (existing) return existing;
  return createGiftRevealForOrder({
    orderId: order.id,
    note: order.gift?.note ?? null,
  });
}

export function isRevealEditable(
  order: Order,
  reveal: GiftReveal,
): boolean {
  if (reveal.lockedAt) return false;
  return PRE_SHIP_STATUSES.has(order.status);
}

export async function updateGiftReveal(
  orderId: string,
  patch: {
    note?: string | null;
    videoPath?: string | null;
    photoPath?: string | null;
    clearVideo?: boolean;
    clearPhoto?: boolean;
  },
): Promise<GiftReveal> {
  const db = admin();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.note !== undefined) updates.note = patch.note?.trim() || null;
  if (patch.videoPath !== undefined) updates.video_path = patch.videoPath;
  if (patch.photoPath !== undefined) updates.photo_path = patch.photoPath;
  if (patch.clearVideo) updates.video_path = null;
  if (patch.clearPhoto) updates.photo_path = null;

  const { data, error } = await db
    .from("gift_reveals")
    .update(updates)
    .eq("order_id", orderId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapReveal(data);
}

export async function markRevealOpened(token: string): Promise<GiftReveal> {
  const db = admin();
  const existing = await getRevealByToken(token);
  if (!existing) throw new Error("Reveal not found");
  if (existing.openedAt) return existing;

  const { data, error } = await db
    .from("gift_reveals")
    .update({
      opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("token", token)
    .is("opened_at", null)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return mapReveal(data);
  return (await getRevealByToken(token))!;
}

export async function lockGiftReveal(orderId: string): Promise<void> {
  const db = admin();
  await db
    .from("gift_reveals")
    .update({
      locked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .is("locked_at", null);
}
