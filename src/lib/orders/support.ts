import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ChatChannel,
  OrderSupportMessage,
  OrderSupportRole,
} from "@/types/order-support";

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
    channel: row.channel === "vendor" ? "vendor" : "customer",
    createdAt: String(row.created_at),
  };
}

/** `vendorId` scopes the vendor channel to one vendor's thread (plus legacy shared messages). */
export async function listOrderSupportMessages(
  orderId: string,
  channel: ChatChannel,
  vendorId?: string | null,
): Promise<OrderSupportMessage[]> {
  let query = db()
    .from("order_support_messages")
    .select("*")
    .eq("order_id", orderId)
    .eq("channel", channel);
  if (channel === "vendor" && vendorId && /^[0-9a-f-]{36}$/i.test(vendorId)) {
    query = query.or(`vendor_id.eq.${vendorId},vendor_id.is.null`);
  }
  const { data, error } = await query
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
  channel: ChatChannel;
  vendorId?: string | null;
}): Promise<OrderSupportMessage> {
  const { data, error } = await db()
    .from("order_support_messages")
    .insert({
      order_id: input.orderId,
      sender_id: input.senderId ?? null,
      sender_role: input.senderRole,
      sender_name: input.senderName,
      body: input.body,
      channel: input.channel,
      ...(input.channel === "vendor" && input.vendorId ? { vendor_id: input.vendorId } : {}),
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

/** Vendors with items on this order (for the admin thread picker + emails). */
export async function listOrderVendorContacts(
  orderId: string,
): Promise<{ vendorId: string; email: string; name: string; businessName: string }[]> {
  const { data, error } = await db()
    .from("vendor_order_items")
    .select("vendor_id, vendors(contact_email, contact_name, business_name)")
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
  const seen = new Map<
    string,
    { vendorId: string; email: string; name: string; businessName: string }
  >();
  for (const row of data ?? []) {
    const v = row.vendors as
      | { contact_email?: string; contact_name?: string; business_name?: string }
      | { contact_email?: string; contact_name?: string; business_name?: string }[]
      | null;
    const vendor = Array.isArray(v) ? v[0] : v;
    if (!row.vendor_id || !vendor) continue;
    seen.set(String(row.vendor_id), {
      vendorId: String(row.vendor_id),
      email: vendor.contact_email ?? "",
      name: vendor.contact_name || vendor.business_name || "there",
      businessName: vendor.business_name || vendor.contact_name || "Vendor",
    });
  }
  return [...seen.values()];
}
