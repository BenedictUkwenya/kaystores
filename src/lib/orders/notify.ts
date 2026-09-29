import { sendNotice } from "@/lib/email/notice";
import { getEmailSiteUrl } from "@/lib/site";
import { formatNaira } from "@/lib/data/home";
import { discreetItemLabel } from "@/lib/after-dark/checkout-privacy";
import { formatAddressLines, getDeliveryAddress } from "@/lib/orders/address";
import { orderAccessPath } from "@/lib/orders/access";
import type { Order } from "@/types/order";

function itemLines(order: Order): string[] {
  return order.items.map(
    (item, i) =>
      `${discreetItemLabel(item, i)}${item.variationOptionLabel ? ` (${item.variationOptionLabel})` : ""} × ${item.quantity}`,
  );
}

function hasPrivateItems(order: Order): boolean {
  return order.items.some((item) => item.segment === "after_dark");
}

function orderDetailLines(order: Order): string[] {
  const address = formatAddressLines(getDeliveryAddress(order)).join(", ");
  const recipient =
    order.deliveryType === "gift" && order.gift
      ? `Gift for ${order.gift.recipientName}${order.gift.recipientPhone ? ` · ${order.gift.recipientPhone}` : ""}`
      : "Delivering to the buyer";
  return [
    `Buyer: ${order.buyer.fullName} · ${order.buyer.phone} · ${order.buyer.email}`,
    recipient,
    address ? `Deliver to: ${address}` : "Delivery address: not provided",
    ...(order.anonymousPackaging || hasPrivateItems(order)
      ? ["Packaging: plain, unmarked (anonymous / private items)."]
      : []),
    "Items:",
    ...itemLines(order),
  ];
}

/** Rich "new paid order" alert for every admin + team inbox. */
export async function notifyAdminsNewOrder(order: Order): Promise<void> {
  await sendNotice({
    type: "admin_alert",
    toTeam: true,
    subject: `New paid order #${order.orderNumber} — ${formatNaira(order.pricing.grandTotal)}`,
    title: "New paid order",
    paragraphs: [
      ...orderDetailLines(order),
      `Total paid: ${formatNaira(order.pricing.grandTotal)}${order.paymentReference ? ` · ref ${order.paymentReference}` : ""}`,
    ],
    ctaUrl: `${getEmailSiteUrl()}/admin/orders/${order.id}`,
    ctaLabel: "Open order",
  });
}

/** Bank-transfer order placed (or transfer claimed) — awaiting admin verification. */
export async function notifyManualPaymentClaim(order: Order): Promise<void> {
  await sendNotice({
    type: "admin_alert",
    toTeam: true,
    subject: `New order awaiting transfer — #${order.orderNumber} · ${formatNaira(order.pricing.grandTotal)}`,
    title: "Order placed — verify bank transfer",
    paragraphs: [
      `${order.buyer.fullName} placed order #${order.orderNumber} and says they paid ${formatNaira(order.pricing.grandTotal)} by bank transfer.`,
      "Check the bank account, then use “Mark payment paid” on the order. Vendors are only notified after you confirm.",
      ...orderDetailLines(order),
    ],
    ctaUrl: `${getEmailSiteUrl()}/admin/orders/${order.id}`,
    ctaLabel: "Verify payment",
  });
}

function customerRecipients(order: Order, includeGiftRecipient: boolean): string[] {
  const to = [order.buyer.email];
  if (includeGiftRecipient && order.deliveryType === "gift" && order.gift?.recipientEmail) {
    to.push(order.gift.recipientEmail);
  }
  return to.filter(Boolean);
}

export async function notifyOrderShipped(
  order: Order,
  tracking?: { carrier?: string; number?: string; url?: string },
): Promise<void> {
  const trackingLine = tracking?.number
    ? `Carrier: ${tracking.carrier ?? "Courier"} · Tracking number: ${tracking.number}`
    : "Our delivery team will call before arriving.";
  await sendNotice({
    type: "order_update",
    to: [order.buyer.email],
    subject: `Your order #${order.orderNumber} is on its way`,
    title: "Your order has shipped",
    paragraphs: [
      "Good news — your order passed Kay's quality check and has left our hub.",
      trackingLine,
    ],
    ctaUrl: tracking?.url || `${getEmailSiteUrl()}${orderAccessPath(order.id)}`,
    ctaLabel: tracking?.url ? "Track delivery" : "View order",
  });
  if (order.deliveryType === "gift" && order.gift?.recipientEmail) {
    await sendNotice({
      type: "order_update",
      to: [order.gift.recipientEmail],
      subject: "A gift is on its way to you",
      title: "Your gift is on its way",
      paragraphs: [
        order.gift.anonymous
          ? "Someone special has sent you a gift through Kay Stores. It's on its way now."
          : `${order.buyer.fullName.split(/\s+/)[0]} has sent you a gift through Kay Stores. It's on its way now.`,
        trackingLine,
      ],
    });
  }
}

export async function notifyOrderDelivered(order: Order): Promise<void> {
  await sendNotice({
    type: "order_update",
    to: [order.buyer.email],
    subject: `Delivered — order #${order.orderNumber}`,
    title: "Your order was delivered",
    paragraphs: [
      order.deliveryType === "gift"
        ? `Your gift for ${order.gift?.recipientName ?? "your recipient"} has been delivered.`
        : "Your order has been delivered. We hope you love it.",
      "Something not right? Reply to this email or message us from your order page.",
    ],
    ctaUrl: `${getEmailSiteUrl()}${orderAccessPath(order.id)}`,
    ctaLabel: "View order",
  });
}

export async function notifyOrderCancelled(
  order: Order,
  reason: string,
  refundDue: boolean,
): Promise<void> {
  await sendNotice({
    type: "order_update",
    to: customerRecipients(order, false),
    subject: `Order #${order.orderNumber} was cancelled`,
    title: "Your order was cancelled",
    paragraphs: [
      reason,
      refundDue
        ? `We'll refund ${formatNaira(order.pricing.grandTotal)} to your original payment method. Refunds usually take 3–7 working days.`
        : "You were not charged.",
    ],
    ctaUrl: `${getEmailSiteUrl()}/gifts`,
    ctaLabel: "Continue shopping",
  });
}

export async function notifyVendorItemUpdate(input: {
  vendorEmail: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  kind: "received" | "qc_failed" | "cancelled";
  note?: string;
}): Promise<void> {
  const copy = {
    received: {
      subject: `Received at hub — order #${input.orderNumber}`,
      title: "We've received your item",
      body: `${input.productName} arrived at the Kay hub and is going through quality check.`,
    },
    qc_failed: {
      subject: `Action needed — ${input.productName} failed QC`,
      title: "Your item didn't pass quality check",
      body: `${input.productName} for order #${input.orderNumber} didn't pass Kay's quality check. Please contact us to arrange a replacement.`,
    },
    cancelled: {
      subject: `Cancelled — order #${input.orderNumber}`,
      title: "An order item was cancelled",
      body: `${input.productName} for order #${input.orderNumber} has been cancelled. Please don't send it to the hub.`,
    },
  }[input.kind];
  await sendNotice({
    type: "vendor_update",
    to: [input.vendorEmail],
    subject: copy.subject,
    title: copy.title,
    paragraphs: [copy.body],
    quote: input.note,
    ctaUrl: `${getEmailSiteUrl()}/vendor/orders/${input.orderId}`,
    ctaLabel: "Open order",
  });
}

export async function notifyAdminsVendorDispatched(input: {
  orderId: string;
  orderNumber: string;
  productName: string;
  vendorName: string;
  hubName: string | null;
}): Promise<void> {
  await sendNotice({
    type: "admin_alert",
    toTeam: true,
    subject: `On its way to ${input.hubName ?? "the hub"} — order #${input.orderNumber}`,
    title: "Vendor dispatched to hub",
    paragraphs: [
      `${input.vendorName} has sent ${input.productName} to ${input.hubName ?? "a Kay hub"}.`,
      "Mark it received when it arrives, then run QC.",
    ],
    ctaUrl: `${getEmailSiteUrl()}/admin/orders/${input.orderId}`,
    ctaLabel: "Open order",
  });
}
