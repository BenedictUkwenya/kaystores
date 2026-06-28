import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/env";
import {
  buildOrderInsert,
  mapOrderRow,
  mapOrderSummary,
  type OrderRow,
} from "@/lib/orders/map";
import type {
  AddressDetails,
  CreateOrderPayload,
  Order,
  OrderSummary,
} from "@/types/order";

export function isSupabaseOrdersEnabled(): boolean {
  return getSupabaseConfig().isConfigured;
}

export async function insertOrder(
  payload: CreateOrderPayload,
  meta: {
    id: string;
    orderNumber: string;
    userId?: string;
    handoverToken?: string;
    status: Order["status"];
    handoverStatus: Order["handoverStatus"];
  },
): Promise<Order> {
  const supabase = await createClient();
  const insert = buildOrderInsert({
    id: meta.id,
    orderNumber: meta.orderNumber,
    userId: meta.userId,
    status: meta.status,
    deliveryType: payload.deliveryType,
    items: payload.items,
    subtotal: payload.pricing.productSubtotal,
    pricing: payload.pricing,
    buyer: payload.buyer,
    buyerAddress: payload.buyerAddress,
    gift: payload.gift,
    handoverToken: meta.handoverToken,
    handoverStatus: meta.handoverStatus,
  });

  const { data, error } = await supabase
    .from("orders")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save order.");
  }

  return mapOrderRow(data as OrderRow);
}

async function readOrderBy(
  column: "id" | "order_number" | "handover_token",
  value: string,
): Promise<Order | null> {
  if (isAdminConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("orders")
        .select("*")
        .eq(column, value)
        .maybeSingle();
      if (error || !data) return null;
      return mapOrderRow(data as OrderRow);
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq(column, value)
    .maybeSingle();
  if (error || !data) return null;
  return mapOrderRow(data as OrderRow);
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  return readOrderBy("id", id);
}

export async function fetchOrderByOrderNumber(
  orderNumber: string,
): Promise<Order | null> {
  return readOrderBy("order_number", orderNumber);
}

export async function lookupOrderByReference(
  orderNumber: string,
  email: string,
): Promise<Order | null> {
  const order = await fetchOrderByOrderNumber(orderNumber);
  if (!order) return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (order.buyer.email.trim().toLowerCase() !== normalizedEmail) {
    return null;
  }

  return order;
}

export async function fetchOrdersForAccount(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, delivery_type, pricing, subtotal, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapOrderSummary(row as OrderRow));
}

export async function fetchOrderByHandoverToken(
  token: string,
): Promise<Order | null> {
  return readOrderBy("handover_token", token);
}

export async function updateOrderHandover(
  token: string,
  address: AddressDetails,
): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      recipient_address: address,
      handover_status: "completed",
      status: "processing",
    })
    .eq("handover_token", token)
    .eq("handover_status", "pending")
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapOrderRow(data as OrderRow);
}
