import type { Order } from "@/types/order";
import type { FulfillmentStatus } from "@/types/dashboard";
import type { Job, JobUrgency, VendorJob } from "@/lib/jobs/types";
import { formatJobMoney } from "@/lib/jobs/labels";
import { hoursSince, urgencyFromAge, worstUrgency } from "@/lib/jobs/shared";

/** The bits of a vendor_order_items row the job model needs. */
export type GiftLine = {
  id: string;
  orderId: string;
  vendorId: string;
  vendorName: string;
  productName: string;
  quantity: number;
  vendorEarnings: number;
  fulfillmentStatus: FulfillmentStatus;
  vendorDispatchedAt: string | null;
  hubReminderSentAt: string | null;
  selectedHubName: string | null;
  qcNote: string | null;
  createdAt: string;
};

export function mapGiftLine(row: Record<string, unknown>): GiftLine {
  const vendors = row.vendors as
    | { business_name?: string }
    | { business_name?: string }[]
    | null
    | undefined;
  const vendor = Array.isArray(vendors) ? vendors[0] : vendors;
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    vendorId: String(row.vendor_id),
    vendorName: vendor?.business_name ?? "Vendor",
    productName: String(row.product_name ?? "Item"),
    quantity: Number(row.quantity ?? 1),
    vendorEarnings: Number(row.vendor_earnings ?? 0),
    fulfillmentStatus: row.fulfillment_status as FulfillmentStatus,
    vendorDispatchedAt:
      row.vendor_dispatched_at != null ? String(row.vendor_dispatched_at) : null,
    hubReminderSentAt:
      row.hub_reminder_sent_at != null ? String(row.hub_reminder_sent_at) : null,
    selectedHubName:
      row.selected_hub_name != null ? String(row.selected_hub_name) : null,
    qcNote: row.qc_note != null ? String(row.qc_note) : null,
    createdAt: String(row.created_at),
  };
}

function orderTitle(order: Order): string {
  const first = order.items[0]?.name ?? "Order";
  const more = order.items.length - 1;
  return more > 0 ? `${first} +${more} more` : first;
}

function orderSubtitle(order: Order): string {
  if (order.deliveryType === "gift" && order.gift?.recipientName) {
    return `Gift for ${order.gift.recipientName}`;
  }
  return "Delivering to the buyer";
}

const isOpenLine = (l: GiftLine) => l.fulfillmentStatus !== "cancelled";
const isWaitingOnVendor = (l: GiftLine) =>
  l.fulfillmentStatus === "awaiting_hub_delivery" && !l.vendorDispatchedAt;
const isOnTheWayToHub = (l: GiftLine) =>
  l.fulfillmentStatus === "awaiting_hub_delivery" && Boolean(l.vendorDispatchedAt);

export function giftJob(order: Order, allLines: GiftLine[]): Job {
  const lines = allLines.filter(isOpenLine);
  const vendorNames = [...new Set(lines.map((l) => l.vendorName))];
  const base = {
    key: `gift:${order.id}`,
    kind: "gift" as const,
    id: order.id,
    reference: `#${order.orderNumber}`,
    title: orderTitle(order),
    subtitle: orderSubtitle(order),
    clientName: order.buyer.fullName || order.buyer.email,
    vendorNames,
    clientAmount: order.pricing.grandTotal,
    vendorAmount: lines.reduce((sum, l) => sum + l.vendorEarnings, 0) || null,
    paid: order.paymentStatus === "paid",
    createdAt: order.createdAt,
    href: `/admin/jobs/gift/${order.id}`,
    urgency: "normal" as JobUrgency,
  };
  const total = formatJobMoney(order.pricing.grandTotal);

  if (order.paymentStatus === "refunded") {
    return { ...base, stage: "cancelled", actor: "none", nextStep: "Cancelled and refunded." };
  }
  if (order.status === "cancelled") {
    return order.paymentStatus === "paid"
      ? {
          ...base,
          stage: "cancelled",
          actor: "admin",
          nextStep: `Cancelled after payment. Refund ${total} to the client, then mark it refunded.`,
          urgency: "soon",
        }
      : { ...base, stage: "cancelled", actor: "none", nextStep: "Cancelled before payment." };
  }
  if (order.status === "delivered") {
    return { ...base, stage: "done", actor: "none", nextStep: "Delivered." };
  }

  if (order.paymentStatus !== "paid") {
    if (order.paymentReference === "manual-claim") {
      return {
        ...base,
        stage: "awaiting_payment",
        actor: "admin",
        nextStep: `Client says they sent ${total} by bank transfer. Check the bank, then mark it paid.`,
        urgency: urgencyFromAge(order.createdAt, 2, 12),
      };
    }
    return {
      ...base,
      stage: "awaiting_payment",
      actor: "client",
      nextStep:
        order.paymentMode === "split"
          ? "Waiting for everyone in the split to pay."
          : "Waiting for the client to finish paying.",
    };
  }

  if (order.status === "shipped") {
    return {
      ...base,
      stage: "out_for_delivery",
      actor: "admin",
      nextStep: "On its way to the client. Mark delivered once it arrives.",
      quickAction: {
        action: "deliver",
        label: "Mark delivered",
        confirm: "Mark this order delivered? The client is emailed and vendors get paid.",
      },
      urgency: urgencyFromAge(order.paidAt ?? order.createdAt, 96, 168),
    };
  }

  const sinceCheckout = urgencyFromAge(order.paidAt ?? order.createdAt, 24, 72);

  const onTheWay = lines.find(isOnTheWayToHub);
  if (onTheWay) {
    return {
      ...base,
      stage: "preparing",
      actor: "admin",
      nextStep: `${onTheWay.vendorName} sent "${onTheWay.productName}" to ${onTheWay.selectedHubName ?? "the hub"}. Mark it received when it arrives.`,
      quickAction: { action: "hub_received", label: "Mark received at hub", itemId: onTheWay.id },
      urgency: sinceCheckout,
    };
  }

  const atHub = lines.find((l) => l.fulfillmentStatus === "at_hub");
  if (atHub) {
    return {
      ...base,
      stage: "at_hub",
      actor: "admin",
      nextStep: `"${atHub.productName}" is at the hub. Check it looks right (quality check).`,
      quickAction: { action: "qc_pass", label: "Passed quality check", itemId: atHub.id },
      urgency: sinceCheckout,
    };
  }

  const waiting = lines.filter(isWaitingOnVendor);
  if (waiting.length > 0) {
    const overdue = waiting.some((l) => l.hubReminderSentAt);
    const first = waiting[0];
    return {
      ...base,
      stage: "preparing",
      actor: "vendor",
      nextStep:
        waiting.length === 1
          ? first.qcNote
            ? `"${first.productName}" failed quality check ("${first.qcNote}"). Waiting for ${first.vendorName} to send a replacement.`
            : `Waiting for ${first.vendorName} to send "${first.productName}" to the hub.`
          : `Waiting for ${waiting.length} items from ${[...new Set(waiting.map((l) => l.vendorName))].join(", ")}.`,
      urgency: worstUrgency(overdue ? "overdue" : "normal", sinceCheckout),
    };
  }

  if (order.handoverStatus === "pending") {
    return {
      ...base,
      stage: "at_hub",
      actor: "client",
      nextStep: "Everything passed quality check. Waiting for the gift recipient to share their address.",
    };
  }

  return {
    ...base,
    stage: "at_hub",
    actor: "admin",
    nextStep:
      lines.length > 0
        ? "Everything passed quality check. Book delivery and send it out."
        : "Kay stock. Pack it and book delivery.",
    urgency: sinceCheckout,
  };
}

export function giftVendorJob(line: GiftLine, order: {
  orderNumber: string;
  paymentStatus?: string;
  status?: string;
}): VendorJob {
  const base = {
    key: `gift:${line.id}`,
    kind: "gift" as const,
    id: line.id,
    reference: `#${order.orderNumber}`,
    title: line.quantity > 1 ? `${line.productName} ×${line.quantity}` : line.productName,
    subtitle: "Gift order",
    amount: line.vendorEarnings,
    createdAt: line.createdAt,
    href: `/vendor/jobs/gift/${line.id}`,
    urgency: "normal" as JobUrgency,
  };

  switch (line.fulfillmentStatus) {
    case "awaiting_payment":
      return {
        ...base,
        tab: "in_progress",
        stage: "awaiting_payment",
        nextStep: "Client hasn't paid yet. Don't send anything.",
      };
    case "awaiting_hub_delivery":
      if (line.vendorDispatchedAt) {
        return {
          ...base,
          tab: "in_progress",
          stage: "preparing",
          nextStep: `Sent to ${line.selectedHubName ?? "the hub"}. Kay will confirm when it arrives.`,
        };
      }
      return {
        ...base,
        tab: "todo",
        stage: "preparing",
        nextStep: line.qcNote
          ? `Kay's quality check failed: "${line.qcNote}". Send a replacement to the hub.`
          : "Pack it and send it to a Kay hub, then tap \"I've sent it\".",
        urgency: line.hubReminderSentAt
          ? "overdue"
          : hoursSince(line.createdAt) > 24
            ? "soon"
            : "normal",
      };
    case "at_hub":
    case "qc_passed":
      return {
        ...base,
        tab: "in_progress",
        stage: "at_hub",
        nextStep: "Kay has it. Nothing more for you to do.",
      };
    case "dispatched":
      return {
        ...base,
        tab: "in_progress",
        stage: "out_for_delivery",
        nextStep: "On its way to the client. You're paid once it's delivered.",
      };
    case "completed":
      return { ...base, tab: "done", stage: "done", nextStep: "Delivered. Earnings released to your wallet." };
    case "cancelled":
    default:
      return { ...base, tab: "done", stage: "cancelled", nextStep: "Cancelled." };
  }
}
