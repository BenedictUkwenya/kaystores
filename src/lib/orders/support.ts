import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderSupportMessage, OrderSupportRole } from "@/types/order-support";

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

function mapMessage(row: Record<string, unknown>): OrderSupportMessage {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    senderId: row.sender_id != null ? String(row.sender_id) : null,
    senderRole: row.sender_role as OrderSupportRole,
    senderName: String(row.sender_name ?? "Kay"),
    body: String(row.body ?? ""),
    createdAt: String(row.created_at),
  };
}

export async function listOrderSupportMessages(
  orderId: string,
): Promise<OrderSupportMessage[]> {
  const { data, error } = await db()
    .from("order_support_messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function insertOrderSupportMessage(input: {
  orderId: string;
  senderId?: string | null;
  senderRole: OrderSupportRole;
  senderName: string;
  body: string;
}): Promise<OrderSupportMessage> {
  const { data, error } = await db()
    .from("order_support_messages")
    .insert({
      order_id: input.orderId,
      sender_id: input.senderId ?? null,
      sender_role: input.senderRole,
      sender_name: input.senderName,
      body: input.body,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not send message.");
  }
  return mapMessage(data as Record<string, unknown>);
}

export async function vendorHasOrder(
  vendorId: string,
  orderId: string,
): Promise<boolean> {
  const { data, error } = await db()
    .from("vendor_order_items")
    .select("id")
    .eq("vendor_id", vendorId)
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}
