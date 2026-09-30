import type {
  ConciergeRequest,
  ConciergeRequestWithAssignments,
  ConciergeVendorAssignment,
} from "@/types/concierge";
import type { FulfilmentStage } from "@/types/fulfilment";
import type { MarkupTier } from "@/types/pricing";
import { applyClientMarkup } from "@/lib/pricing/markup";
import type { Job, JobUrgency, VendorJob } from "@/lib/jobs/types";
import { formatJobMoney } from "@/lib/jobs/labels";
import { hubStepNext, urgencyFromAge } from "@/lib/jobs/shared";

export function selectedAssignment(
  r: ConciergeRequestWithAssignments,
): ConciergeVendorAssignment | undefined {
  return (
    r.assignments.find((a) => a.id === r.selectedAssignmentId) ??
    r.assignments.find((a) => a.outcome === "selected")
  );
}

/** Before migration 045 the only signal was the assignment's own status. */
export function effectiveConciergeStage(
  r: ConciergeRequest,
  selected?: ConciergeVendorAssignment,
): FulfilmentStage {
  if (r.status === "completed") return "delivered";
  if (r.fulfilmentStage === "awaiting_vendor" && selected?.fulfilmentStatus === "at_hub") {
    return "vendor_sent";
  }
  return r.fulfilmentStage;
}

export function conciergeJob(
  r: ConciergeRequestWithAssignments,
  tiers?: MarkupTier[],
): Job {
  const selected = selectedAssignment(r);
  const offers = r.assignments.filter((a) => a.status === "has_product");
  const vendorNames = selected
    ? [selected.vendorBusinessName ?? "Vendor"]
    : [...new Set(r.assignments.map((a) => a.vendorBusinessName ?? "Vendor"))];
  const vendorPrice = selected?.quotedPrice ?? null;
  const clientPrice =
    r.paymentAmount ?? (vendorPrice != null ? applyClientMarkup(vendorPrice, tiers) : null);

  const base = {
    key: `concierge:${r.id}`,
    kind: "concierge" as const,
    id: r.id,
    reference: r.referenceNumber,
    title: r.brand ? `${r.productName} · ${r.brand}` : r.productName,
    subtitle: `Budget ${formatJobMoney(r.budget)}`,
    clientName: r.contactName,
    vendorNames,
    clientAmount: clientPrice,
    vendorAmount: vendorPrice,
    paid: r.paymentStatus === "paid",
    createdAt: r.createdAt,
    href: `/admin/jobs/concierge/${r.id}`,
    urgency: "normal" as JobUrgency,
  };

  if (r.status === "completed") {
    return { ...base, stage: "done", actor: "none", nextStep: "Delivered." };
  }
  if (r.paymentStatus === "refunded") {
    return { ...base, stage: "cancelled", actor: "none", nextStep: "Refunded." };
  }
  if (r.status === "closed") {
    return r.paymentStatus === "paid"
      ? {
          ...base,
          stage: "cancelled",
          actor: "admin",
          nextStep: `Closed after payment. Refund ${formatJobMoney(r.paymentAmount)} to the client.`,
          urgency: "soon",
        }
      : { ...base, stage: "cancelled", actor: "none", nextStep: "Closed." };
  }

  if (r.paymentStatus === "paid") {
    const step = hubStepNext({
      stage: effectiveConciergeStage(r, selected),
      vendorName: selected?.vendorBusinessName ?? "the vendor",
      hubName: r.dropoffHubName,
      qcNote: r.qcNote,
    });
    return {
      ...base,
      ...step,
      urgency: step.stage === "done" ? "normal" : urgencyFromAge(r.paidAt, 72, 120),
    };
  }

  if (r.status === "vendor_selected" || r.status === "in_fulfilment" || r.status === "in_progress") {
    return {
      ...base,
      stage: "awaiting_payment",
      actor: "client",
      nextStep:
        r.paymentStatus === "pending"
          ? "Client is paying."
          : `Client accepted ${formatJobMoney(clientPrice)}. Waiting for them to pay.`,
    };
  }

  if (r.status === "client_reviewing") {
    return {
      ...base,
      stage: "client_deciding",
      actor: "client",
      nextStep: `Offer of ${formatJobMoney(clientPrice)} sent. Waiting for the client to accept or ask for changes.`,
    };
  }

  if (r.status === "pending" || r.assignments.length === 0) {
    return {
      ...base,
      stage: "new",
      actor: "admin",
      nextStep: "New request. Send it to vendors who might have it.",
      urgency: urgencyFromAge(r.createdAt, 4, 24),
    };
  }

  if (r.status === "revision_requested") {
    return {
      ...base,
      stage: "with_vendor",
      actor: "admin",
      nextStep: r.clientFeedback
        ? `Client asked for changes: "${r.clientFeedback}". Present another offer.`
        : "Client asked for changes. Present another offer.",
      urgency: "soon",
    };
  }

  if (offers.length > 0) {
    return {
      ...base,
      stage: "with_vendor",
      actor: "admin",
      nextStep:
        offers.length === 1
          ? `${offers[0].vendorBusinessName ?? "A vendor"} has it for ${formatJobMoney(offers[0].quotedPrice)}. Present it to the client.`
          : `${offers.length} vendors have it. Pick the best offer and present it to the client.`,
      urgency: urgencyFromAge(offers[0].respondedAt, 4, 24),
    };
  }

  if (r.assignments.some((a) => a.status === "need_more_info")) {
    return {
      ...base,
      stage: "with_vendor",
      actor: "admin",
      nextStep: "A vendor needs more details before they can quote. Check their note.",
      urgency: "soon",
    };
  }

  const replied = r.assignments.filter((a) => a.status !== "pending").length;
  if (replied === r.assignments.length) {
    return {
      ...base,
      stage: "with_vendor",
      actor: "admin",
      nextStep: "No vendor has it. Send it to more vendors or close the request.",
      urgency: "soon",
    };
  }

  return {
    ...base,
    stage: "with_vendor",
    actor: "vendor",
    nextStep: `Waiting for vendors to reply (${replied} of ${r.assignments.length} so far).`,
    urgency: urgencyFromAge(r.dispatchedAt ?? r.createdAt, 24, 48),
  };
}

export function conciergeVendorJob(
  a: ConciergeVendorAssignment,
  r: ConciergeRequest,
): VendorJob {
  const base = {
    key: `concierge:${a.id}`,
    kind: "concierge" as const,
    id: a.id,
    reference: r.referenceNumber,
    title: r.brand ? `${r.productName} · ${r.brand}` : r.productName,
    subtitle: "Concierge request",
    amount: a.quotedPrice,
    createdAt: a.sentAt,
    href: `/vendor/jobs/concierge/${a.id}`,
    urgency: "normal" as JobUrgency,
  };

  if (a.outcome === "not_chosen" || (r.status === "closed" && a.outcome !== "selected")) {
    return { ...base, tab: "done", stage: "cancelled", nextStep: "Kay went with another option this time." };
  }

  if (a.outcome === "selected") {
    if (r.status === "completed") {
      return { ...base, tab: "done", stage: "done", nextStep: "Delivered. Thank you!" };
    }
    if (r.paymentStatus !== "paid") {
      return {
        ...base,
        tab: "in_progress",
        stage: "awaiting_payment",
        nextStep: "The client picked your item. Waiting for payment. Don't send it yet.",
      };
    }
    const hub = r.dropoffHubName ?? "the Kay hub";
    switch (effectiveConciergeStage(r, a)) {
      case "awaiting_vendor":
        return {
          ...base,
          tab: "todo",
          stage: "preparing",
          nextStep: r.qcNote
            ? `Kay's quality check failed: "${r.qcNote}". Please send a replacement to ${hub}.`
            : `Paid. Send it to ${hub}, then tap "I've sent it".`,
          urgency: urgencyFromAge(r.paidAt, 24, 72),
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

  switch (a.status) {
    case "pending":
      return {
        ...base,
        tab: "todo",
        stage: "with_vendor",
        nextStep: "A client is looking for this. Do you have it? Reply with your price.",
        urgency: urgencyFromAge(a.sentAt, 12, 24),
      };
    case "need_more_info":
      return { ...base, tab: "in_progress", stage: "with_vendor", nextStep: "You asked for more details. Kay will get back to you." };
    case "no_product":
      return { ...base, tab: "done", stage: "cancelled", nextStep: "You said you don't have it." };
    case "has_product":
    default:
      return {
        ...base,
        tab: "in_progress",
        stage: "client_deciding",
        nextStep: "Offer sent. Kay will tell you if the client picks it.",
      };
  }
}
