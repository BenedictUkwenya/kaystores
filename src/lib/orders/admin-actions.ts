import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOrderById } from "@/lib/orders/repository";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { restoreStockForOrder } from "@/lib/products/stock";
import {
  notifyOrderCancelled,
  notifyOrderDelivered,
  notifyOrderShipped,
  notifyVendorItemUpdate,
} from "@/lib/orders/notify";
import type { Order } from "@/types/order";

export class OrderActionError extends Error {
  status = 409;
}

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Admin client not configured.");
  return client;
}

async function loadOrder(orderId: string): Promise<Order> {
  const order = await fetchOrderById(orderId);
  if (!order) throw Object.assign(new OrderActionError("Order not found."), { status: 404 });
  return order;
}

type ItemRow = {
  id: string;
  order_id: string;
  product_name: string;
  fulfillment_status: string;
  vendors: { contact_email: string | null; business_name: string | null } | null;
};

async function loadItem(orderId: string, itemId: string): Promise<ItemRow> {
  const { data } = await db()
    .from("vendor_order_items")
    .select("id, order_id, product_name, fulfillment_status, vendors(contact_email, business_name)")
    .eq("id", itemId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (!data) throw Object.assign(new OrderActionError("Item not found on this order."), { status: 404 });
  return data as unknown as ItemRow;
}

async function openItems(orderId: string) {
  const { data } = await db()
    .from("vendor_order_items")
    .select("id, fulfillment_status")
    .eq("order_id", orderId)
    .neq("fulfillment_status", "cancelled");
  return data ?? [];
}

/** Admin verified a transfer (or Paystack missed a webhook). Sends all paid emails. */
export async function adminMarkPaid(orderId: string, reference: string) {
  const order = await loadOrder(orderId);
  if (order.status === "cancelled") {
    throw new OrderActionError("This order is cancelled. Refund the customer instead.");
  }
  await confirmOrderPayment(orderId, reference.trim() || "admin-verified");
}

export async function adminHubReceived(orderId: string, itemId: string) {
  const order = await loadOrder(orderId);
  if (order.paymentStatus !== "paid") throw new OrderActionError("Order isn't paid yet.");
  const item = await loadItem(orderId, itemId);
  if (item.fulfillment_status !== "awaiting_hub_delivery") {
    throw new OrderActionError("Only items awaiting hub delivery can be marked received.");
  }
  await db()
    .from("vendor_order_items")
    .update({ fulfillment_status: "at_hub", updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("fulfillment_status", "awaiting_hub_delivery");
  if (item.vendors?.contact_email) {
    await notifyVendorItemUpdate({
      vendorEmail: item.vendors.contact_email,
      orderId,
      orderNumber: order.orderNumber,
      productName: item.product_name,
      kind: "received",
    }).catch(() => undefined);
  }
}

export async function adminQcPass(orderId: string, itemId: string) {
  const item = await loadItem(orderId, itemId);
  if (item.fulfillment_status !== "at_hub") {
    throw new OrderActionError("Mark the item received at the hub before passing QC.");
  }
  await db()
    .from("vendor_order_items")
    .update({ fulfillment_status: "qc_passed", updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("fulfillment_status", "at_hub");
}

export async function adminQcFail(orderId: string, itemId: string, note: string) {
  const order = await loadOrder(orderId);
  const item = await loadItem(orderId, itemId);
  if (!["at_hub", "qc_passed"].includes(item.fulfillment_status)) {
    throw new OrderActionError("Only items at the hub can fail QC.");
  }
  await db()
    .from("vendor_order_items")
    .update({
      fulfillment_status: "awaiting_hub_delivery",
      vendor_dispatched_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);
  if (item.vendors?.contact_email) {
    await notifyVendorItemUpdate({
      vendorEmail: item.vendors.contact_email,
      orderId,
      orderNumber: order.orderNumber,
      productName: item.product_name,
      kind: "qc_failed",
      note: note.trim() || undefined,
    }).catch(() => undefined);
  }
}

async function assertReadyToShip(order: Order) {
  if (order.paymentStatus !== "paid") throw new OrderActionError("Order isn't paid yet.");
  if (order.status === "cancelled") throw new OrderActionError("Order is cancelled.");
  const items = await openItems(order.id);
  if (items.some((i) => i.fulfillment_status !== "qc_passed" && i.fulfillment_status !== "dispatched")) {
    throw new OrderActionError("Every vendor item must pass QC before shipping.");
  }
}

/** Kay-arranged / manual courier: save tracking, mark shipped, email customer. */
export async function adminShip(
  orderId: string,
  tracking: { carrier?: string; number?: string; url?: string },
) {
  const order = await loadOrder(orderId);
  await assertReadyToShip(order);
  const url = tracking.url?.trim();
  if (url && !/^https:\/\//i.test(url)) throw new OrderActionError("Tracking link must start with https://");
  const now = new Date().toISOString();
  await db()
    .from("orders")
    .update({
      status: "shipped",
      tracking_carrier: tracking.carrier?.trim() || null,
      tracking_number: tracking.number?.trim() || null,
      tracking_url: url || null,
    })
    .eq("id", orderId);
  await db()
    .from("vendor_order_items")
    .update({ fulfillment_status: "dispatched", updated_at: now })
    .eq("order_id", orderId)
    .eq("fulfillment_status", "qc_passed");
  if (order.status !== "shipped") {
    await notifyOrderShipped(order, {
      carrier: tracking.carrier?.trim(),
      number: tracking.number?.trim(),
      url,
    }).catch(() => undefined);
  }
}

export { assertReadyToShip };

/** Delivered: close the order and release vendor earnings. */
export async function adminDeliver(orderId: string) {
  const order = await loadOrder(orderId);
  if (order.status !== "shipped") throw new OrderActionError("Mark the order shipped first.");
  const client = db();
  const now = new Date().toISOString();
  const { data: claimed } = await client
    .from("orders")
    .update({ status: "delivered" })
    .eq("id", orderId)
    .eq("status", "shipped")
    .select("id");
  if (!claimed?.length) return;

  const { data: items } = await client
    .from("vendor_order_items")
    .update({ fulfillment_status: "completed", updated_at: now })
    .eq("order_id", orderId)
    .neq("fulfillment_status", "cancelled")
    .select("id");
  const ids = (items ?? []).map((i) => i.id);
  if (ids.length) {
    await client
      .from("vendor_earnings")
      .update({ status: "available", updated_at: now })
      .in("vendor_order_item_id", ids)
      .eq("status", "pending");
  }
  await notifyOrderDelivered(order).catch(() => undefined);
}

/** Cancel before delivery: restock, void vendor lines, tell everyone. */
export async function adminCancel(
  orderId: string,
  reason: string,
  options: { requireUnpaid?: boolean } = {},
): Promise<boolean> {
  const order = await loadOrder(orderId);
  if (order.status === "cancelled") return false;
  if (order.status === "delivered") {
    throw new OrderActionError("Delivered orders can't be cancelled — handle it as a return.");
  }
  if (options.requireUnpaid && order.paymentStatus === "paid") return false;
  const client = db();
  const now = new Date().toISOString();

  let claim = client
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .neq("status", "cancelled");
  if (options.requireUnpaid) claim = claim.neq("payment_status", "paid");
  const { data: claimed } = await claim.select("id");
  if (!claimed?.length) return false;

  await restoreStockForOrder(order.items).catch(() => undefined);

  const { data: items } = await client
    .from("vendor_order_items")
    .select("id, product_name, fulfillment_status, vendors(contact_email)")
    .eq("order_id", orderId)
    .neq("fulfillment_status", "cancelled");
  const rows = (items ?? []) as unknown as {
    id: string;
    product_name: string;
    fulfillment_status: string;
    vendors: { contact_email: string | null } | null;
  }[];

  if (rows.length) {
    const ids = rows.map((r) => r.id);
    await client
      .from("vendor_order_items")
      .update({ fulfillment_status: "cancelled", updated_at: now })
      .in("id", ids);
    await client
      .from("vendor_earnings")
      .delete()
      .in("vendor_order_item_id", ids)
      .eq("status", "pending");
  }

  const paid = order.paymentStatus === "paid";
  await Promise.all([
    notifyOrderCancelled(order, reason.trim() || "Kay had to cancel this order.", paid).catch(
      () => undefined,
    ),
    // Vendors only need to know if they were already asked to send stock.
    ...(paid
      ? rows
          .filter((r) => r.vendors?.contact_email && r.fulfillment_status !== "awaiting_payment")
          .map((r) =>
            notifyVendorItemUpdate({
              vendorEmail: r.vendors!.contact_email!,
              orderId,
              orderNumber: order.orderNumber,
              productName: r.product_name,
              kind: "cancelled",
            }).catch(() => undefined),
          )
      : []),
  ]);
  return true;
}

export async function adminMarkRefunded(orderId: string, reference: string) {
  const order = await loadOrder(orderId);
  if (order.status !== "cancelled" || order.paymentStatus !== "paid") {
    throw new OrderActionError("Only paid, cancelled orders can be marked refunded.");
  }
  await db()
    .from("orders")
    .update({
      payment_status: "refunded",
      payment_reference: reference.trim()
        ? `${order.paymentReference ?? ""} · refund ${reference.trim()}`.trim()
        : order.paymentReference,
    })
    .eq("id", orderId);
}
