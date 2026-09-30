import type { TableRequest } from "@/types/table";
import type { Job, JobUrgency, VendorJob } from "@/lib/jobs/types";
import { formatJobMoney } from "@/lib/jobs/labels";
import {
  hubStepNext,
  urgencyFromAge,
  urgencyFromDeadline,
  worstUrgency,
} from "@/lib/jobs/shared";

const CATEGORY_LABELS: Record<TableRequest["category"], string> = {
  cake: "Custom cake",
  chocolate: "Chocolate box",
  hamper: "Hamper",
  treat: "Treats",
  other: "Kitchen request",
};

function kitchenTitle(r: TableRequest): string {
  const kind = CATEGORY_LABELS[r.category] ?? "Kitchen request";
  return r.occasion ? `${kind} · ${r.occasion}` : kind;
}

function kitchenSubtitle(r: TableRequest): string {
  const where =
    r.fulfillmentMethod === "pickup"
      ? `Pickup at ${r.pickupHubName ?? "Kay hub"}`
      : [r.city, r.state].filter(Boolean).join(", ") || "Delivery";
  return r.neededBy ? `${where} · needed ${r.neededBy}` : where;
}

export function kitchenJob(r: TableRequest): Job {
  const baker = r.assignedVendorName ?? "the baker";
  const base = {
    key: `kitchen:${r.id}`,
    kind: "kitchen" as const,
    id: r.id,
    reference: r.reference,
    title: kitchenTitle(r),
    subtitle: kitchenSubtitle(r),
    clientName: r.contactName,
    vendorNames: r.assignedVendorName ? [r.assignedVendorName] : [],
    neededBy: r.neededBy,
    clientAmount: r.quoteAmount ?? null,
    vendorAmount: r.vendorQuoteAmount ?? null,
    paid: r.paymentStatus === "paid",
    createdAt: r.createdAt,
    href: `/admin/jobs/kitchen/${r.id}`,
  };
  const deadline = urgencyFromDeadline(r.neededBy);

  if (r.paymentStatus === "refunded") {
    return { ...base, stage: "cancelled", actor: "none", nextStep: "Refunded.", urgency: "normal" };
  }
  if (r.status === "declined") {
    return r.paymentStatus === "paid"
      ? {
          ...base,
          stage: "cancelled",
          actor: "admin",
          nextStep: `Declined after payment. Refund ${formatJobMoney(r.quoteAmount)} to the client.`,
          urgency: "soon",
        }
      : { ...base, stage: "cancelled", actor: "none", nextStep: "Declined.", urgency: "normal" };
  }
  if (r.status === "fulfilled") {
    return { ...base, stage: "done", actor: "none", nextStep: "Delivered.", urgency: "normal" };
  }

  if (r.paymentStatus === "paid") {
    const step = hubStepNext({
      stage: r.fulfilmentStage,
      vendorName: baker,
      hubName: r.dropoffHubName ?? r.pickupHubName,
      pickup: r.fulfillmentMethod === "pickup",
      qcNote: r.qcNote,
    });
    return { ...base, ...step, urgency: step.stage === "done" ? "normal" : deadline };
  }

  if (r.status === "quoted" || r.status === "accepted") {
    return {
      ...base,
      stage: "client_deciding",
      actor: "client",
      nextStep:
        r.paymentStatus === "pending"
          ? "Client is paying."
          : `Quote of ${formatJobMoney(r.quoteAmount)} sent. Waiting for the client to accept & pay or decline.`,
      urgency: deadline === "overdue" ? "overdue" : "normal",
    };
  }

  if (!r.assignedVendorId) {
    return {
      ...base,
      stage: "new",
      actor: "admin",
      nextStep: "New request. Pick a baker to price it.",
      urgency: worstUrgency(deadline, urgencyFromAge(r.createdAt, 4, 24)),
    };
  }

  if (r.vendorQuoteAmount == null) {
    return {
      ...base,
      stage: "with_vendor",
      actor: "vendor",
      nextStep: `Waiting for ${baker} to send their price.`,
      urgency: worstUrgency(deadline, urgencyFromAge(r.updatedAt, 12, 24)),
    };
  }

  return {
    ...base,
    stage: "with_vendor",
    actor: "admin",
    nextStep: `${baker} quoted ${formatJobMoney(r.vendorQuoteAmount)}. Set the client price and send the quote.`,
    urgency: worstUrgency(deadline, urgencyFromAge(r.vendorQuotedAt, 2, 12)),
  };
}

export function kitchenVendorJob(r: TableRequest): VendorJob {
  const base = {
    key: `kitchen:${r.id}`,
    kind: "kitchen" as const,
    id: r.id,
    reference: r.reference,
    title: kitchenTitle(r),
    subtitle: kitchenSubtitle(r),
    amount: r.vendorQuoteAmount ?? null,
    neededBy: r.neededBy,
    createdAt: r.createdAt,
    href: `/vendor/jobs/kitchen/${r.id}`,
    urgency: "normal" as JobUrgency,
  };
  const deadline = urgencyFromDeadline(r.neededBy);

  if (r.status === "declined" || r.paymentStatus === "refunded") {
    return { ...base, tab: "done", stage: "cancelled", nextStep: "The client didn't go ahead." };
  }
  if (r.status === "fulfilled") {
    return { ...base, tab: "done", stage: "done", nextStep: "Delivered. Thank you!" };
  }
  if (r.paymentStatus === "paid") {
    const hub = r.dropoffHubName ?? r.pickupHubName ?? "the Kay hub";
    switch (r.fulfilmentStage) {
      case "awaiting_vendor":
        return {
          ...base,
          tab: "todo",
          stage: "preparing",
          nextStep: r.qcNote
            ? `Kay's quality check failed: "${r.qcNote}". Please redo it and send it to ${hub}.`
            : `Confirmed and paid. Make it and send it to ${hub}, then tap "I've sent it".`,
          urgency: deadline,
        };
      case "vendor_sent":
        return { ...base, tab: "in_progress", stage: "preparing", nextStep: `Sent to ${hub}. Kay will confirm when it arrives.` };
      case "at_hub":
      case "qc_passed":
        return { ...base, tab: "in_progress", stage: "at_hub", nextStep: "Kay has it. Nothing more for you to do." };
      case "out_for_delivery":
        return { ...base, tab: "in_progress", stage: "out_for_delivery", nextStep: "On its way to the client." };
      default:
        return { ...base, tab: "done", stage: "done", nextStep: "Delivered. Thank you!" };
    }
  }
  if (r.status === "quoted" || r.status === "accepted") {
    return {
      ...base,
      tab: "in_progress",
      stage: "client_deciding",
      nextStep: "Kay sent your price to the client. Don't start until it's paid.",
    };
  }
  if (r.vendorQuoteAmount == null) {
    return {
      ...base,
      tab: "todo",
      stage: "with_vendor",
      nextStep: "Kay needs your price for this. Send it below.",
      urgency: worstUrgency(deadline, urgencyFromAge(r.updatedAt, 12, 24)),
    };
  }
  return {
    ...base,
    tab: "in_progress",
    stage: "with_vendor",
    nextStep: "Price sent. Kay is preparing the client's quote.",
  };
}
