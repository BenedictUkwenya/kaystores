import { randomBytes } from "crypto";
import {
  fetchOrderByHandoverToken,
  fetchOrderById,
  fetchOrderByOrderNumber,
  fetchOrdersForAccount,
  insertOrder,
  isSupabaseOrdersEnabled,
  lookupOrderByReference,
  updateOrderHandover,
} from "@/lib/orders/repository";
import {
  isOrderNumber,
  isUuid,
  normalizeOrderNumber,
} from "@/lib/orders/resolve";
import type {
  AddressDetails,
  CreateOrderPayload,
  Order,
  OrderSummary,
} from "@/types/order";

const orders = new Map<string, Order>();
const handoverIndex = new Map<string, string>();

function generateOrderNumber() {
  const n = Date.now().toString(36).toUpperCase();
  const r = randomBytes(2).toString("hex").toUpperCase();
  return `KAY-${n.slice(-6)}${r}`;
}

function createOrderInMemory(payload: CreateOrderPayload): Order {
  const id = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  // Gift senders must provide the delivery address — no digital handover.
  const gift =
    payload.deliveryType === "gift" && payload.gift
      ? { ...payload.gift, addressUnknown: false }
      : payload.gift;
  const paid = Boolean(payload.paymentConfirmed);

  const order: Order = {
    id,
    orderNumber,
    status: "confirmed",
    deliveryType: payload.deliveryType,
    items: payload.items,
    subtotal: payload.pricing.productSubtotal,
    pricing: payload.pricing,
    buyer: payload.buyer,
    buyerAddress: payload.buyerAddress,
    gift,
    handoverStatus: "not_required",
    paymentStatus: paid ? "paid" : "unpaid",
    paymentReference: paid ? "manual-confirm" : null,
    paidAt: paid ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  };

  orders.set(id, order);
  return order;
}

export async function createOrder(
  payload: CreateOrderPayload,
  options?: { userId?: string },
): Promise<Order> {
  const id = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const normalized: CreateOrderPayload =
    payload.deliveryType === "gift" && payload.gift
      ? {
          ...payload,
          gift: { ...payload.gift, addressUnknown: false },
        }
      : payload;
  const paid = Boolean(normalized.paymentConfirmed);
  const paidAt = paid ? new Date().toISOString() : null;

  if (isSupabaseOrdersEnabled()) {
    try {
      return await insertOrder(normalized, {
        id,
        orderNumber,
        userId: options?.userId,
        status: "confirmed",
        handoverStatus: "not_required",
        paymentStatus: paid ? "paid" : "unpaid",
        paymentReference: paid ? "manual-confirm" : null,
        paidAt,
      });
    } catch (err) {
      console.error("[orders] Supabase insert failed, using memory:", err);
    }
  }

  return createOrderInMemory(normalized);
}

export async function getOrder(reference: string): Promise<Order | null> {
  const trimmed = reference.trim();

  if (isSupabaseOrdersEnabled()) {
    if (isUuid(trimmed)) {
      const row = await fetchOrderById(trimmed);
      if (row) return row;
    }
    if (isOrderNumber(trimmed)) {
      const row = await fetchOrderByOrderNumber(normalizeOrderNumber(trimmed));
      if (row) return row;
    }
    if (!isUuid(trimmed)) {
      const row = await fetchOrderById(trimmed);
      if (row) return row;
    }
  }

  for (const order of orders.values()) {
    if (order.id === trimmed) return order;
    if (
      isOrderNumber(trimmed) &&
      order.orderNumber.toUpperCase() === normalizeOrderNumber(trimmed)
    ) {
      return order;
    }
  }

  return null;
}

export async function lookupOrder(
  orderNumber: string,
  email: string,
): Promise<Order | null> {
  if (isSupabaseOrdersEnabled()) {
    const row = await lookupOrderByReference(
      normalizeOrderNumber(orderNumber),
      email,
    );
    if (row) return row;
  }

  for (const order of orders.values()) {
    if (
      order.orderNumber.toUpperCase() === normalizeOrderNumber(orderNumber) &&
      order.buyer.email.trim().toLowerCase() === email.trim().toLowerCase()
    ) {
      return order;
    }
  }

  return null;
}

export async function getAccountOrders(): Promise<OrderSummary[]> {
  if (isSupabaseOrdersEnabled()) {
    return fetchOrdersForAccount();
  }
  return [];
}

export async function getOrderByHandoverToken(
  token: string,
): Promise<Order | null> {
  if (isSupabaseOrdersEnabled()) {
    const row = await fetchOrderByHandoverToken(token);
    if (row) return row;
  }
  const id = handoverIndex.get(token);
  if (!id) return null;
  return orders.get(id) ?? null;
}

export async function completeHandover(
  token: string,
  address: AddressDetails,
): Promise<Order | null> {
  if (isSupabaseOrdersEnabled()) {
    const updated = await updateOrderHandover(token, address);
    if (updated) return updated;
  }

  const order = await getOrderByHandoverToken(token);
  if (!order || order.handoverStatus !== "pending") return null;

  const updated: Order = {
    ...order,
    recipientAddress: address,
    handoverStatus: "completed",
    status: "processing",
  };

  orders.set(order.id, updated);
  return updated;
}
