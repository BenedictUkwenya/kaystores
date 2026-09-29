import { getOrder } from "@/lib/orders/store";
import { resolveOrderViewer } from "@/lib/orders/access";
import type { Order } from "@/types/order";

/**
 * Buyer-only access. The email argument is kept for API compatibility but is
 * no longer trusted on its own — it's printed on the order page, so anyone
 * with the link could supply it.
 */
export async function loadOrderForBuyer(
  orderId: string,
  _buyerEmail?: string | null,
): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  return (await resolveOrderViewer(order)) ? order : null;
}
