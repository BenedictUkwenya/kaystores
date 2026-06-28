import { randomBytes } from "crypto";
import type {
  CreateOrderPayload,
  Order,
  AddressDetails,
} from "@/types/order";

const orders = new Map<string, Order>();
const handoverIndex = new Map<string, string>();

function generateOrderNumber() {
  const n = Date.now().toString(36).toUpperCase();
  const r = randomBytes(2).toString("hex").toUpperCase();
  return `KAY-${n.slice(-6)}${r}`;
}

function generateHandoverToken() {
  return randomBytes(24).toString("base64url");
}

export function createOrder(payload: CreateOrderPayload): Order {
  const id = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const needsHandover =
    payload.deliveryType === "gift" && payload.gift?.addressUnknown;

  const handoverToken = needsHandover ? generateHandoverToken() : undefined;

  const order: Order = {
    id,
    orderNumber,
    status: needsHandover ? "pending_handover" : "confirmed",
    deliveryType: payload.deliveryType,
    items: payload.items,
    subtotal: payload.subtotal,
    buyer: payload.buyer,
    buyerAddress: payload.buyerAddress,
    gift: payload.gift,
    handoverToken,
    handoverStatus: needsHandover ? "pending" : "not_required",
    createdAt: new Date().toISOString(),
  };

  orders.set(id, order);
  if (handoverToken) {
    handoverIndex.set(handoverToken, id);
  }

  return order;
}

export function getOrder(id: string): Order | null {
  return orders.get(id) ?? null;
}

export function getOrderByHandoverToken(token: string): Order | null {
  const id = handoverIndex.get(token);
  if (!id) return null;
  return orders.get(id) ?? null;
}

export function completeHandover(
  token: string,
  address: AddressDetails,
): Order | null {
  const order = getOrderByHandoverToken(token);
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
