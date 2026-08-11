import { getSessionUser } from "@/lib/auth/roles";
import { getOrder } from "@/lib/orders/store";
import type { Order } from "@/types/order";

export async function assertBuyerOwnsOrder(
  order: Order,
  buyerEmail?: string | null,
): Promise<boolean> {
  const user = await getSessionUser();
  if (user?.id && order.userId && user.id === order.userId) return true;
  if (user?.email) {
    if (user.email.trim().toLowerCase() === order.buyer.email.trim().toLowerCase()) {
      return true;
    }
  }
  if (
    buyerEmail &&
    buyerEmail.trim().toLowerCase() === order.buyer.email.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

export async function loadOrderForBuyer(
  orderId: string,
  buyerEmail?: string | null,
): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  const ok = await assertBuyerOwnsOrder(order, buyerEmail);
  return ok ? order : null;
}
