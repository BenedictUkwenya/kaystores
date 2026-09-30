import type {
  JobActor,
  JobKind,
  JobStage,
  JobUrgency,
  VendorJobTab,
} from "@/lib/jobs/types";

export const JOB_KIND_LABELS: Record<JobKind, string> = {
  gift: "Gift order",
  kitchen: "Kay Kitchen",
  concierge: "Concierge",
};

export const JOB_KIND_BOARD_HREF: Record<JobKind, string> = {
  gift: "/admin/gifts",
  kitchen: "/admin/kitchen",
  concierge: "/admin/concierge",
};

export const JOB_STAGE_LABELS: Record<JobStage, string> = {
  new: "New",
  with_vendor: "With vendor",
  client_deciding: "Client deciding",
  awaiting_payment: "Awaiting payment",
  preparing: "Being prepared",
  at_hub: "At Kay hub",
  out_for_delivery: "Out for delivery",
  done: "Done",
  cancelled: "Cancelled",
};

/** Plain-English explanation shown under each stage on boards. */
export const JOB_STAGE_HINTS: Record<JobStage, string> = {
  new: "Just came in. Kay decides which vendor gets it.",
  with_vendor: "A vendor is pricing or checking stock.",
  client_deciding: "The client has Kay's price and is deciding.",
  awaiting_payment: "Waiting for money to land.",
  preparing: "Paid. The vendor is making or packing it and sending it to a Kay hub.",
  at_hub: "It's with Kay. Check quality, then send it out.",
  out_for_delivery: "On its way to the client.",
  done: "Delivered and closed.",
  cancelled: "Stopped. Refund if the client paid.",
};

export const JOB_ACTOR_LABELS: Record<JobActor, string> = {
  admin: "Your turn",
  vendor: "Waiting on vendor",
  client: "Waiting on client",
  none: "Nothing to do",
};

export const JOB_URGENCY_LABELS: Record<JobUrgency, string> = {
  overdue: "Overdue",
  soon: "Due soon",
  normal: "",
};

export const VENDOR_TAB_LABELS: Record<VendorJobTab, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

/** Columns on each board, left to right. */
export const BOARD_STAGES: Record<JobKind, JobStage[]> = {
  gift: ["awaiting_payment", "preparing", "at_hub", "out_for_delivery", "done", "cancelled"],
  kitchen: [
    "new",
    "with_vendor",
    "client_deciding",
    "preparing",
    "at_hub",
    "out_for_delivery",
    "done",
    "cancelled",
  ],
  concierge: [
    "new",
    "with_vendor",
    "client_deciding",
    "awaiting_payment",
    "preparing",
    "at_hub",
    "out_for_delivery",
    "done",
    "cancelled",
  ],
};

/** Steps shown in the tracker on a job page (cancelled is shown separately). */
export const TRACKER_STAGES: Record<JobKind, JobStage[]> = {
  gift: ["awaiting_payment", "preparing", "at_hub", "out_for_delivery", "done"],
  kitchen: [
    "new",
    "with_vendor",
    "client_deciding",
    "preparing",
    "at_hub",
    "out_for_delivery",
    "done",
  ],
  concierge: [
    "new",
    "with_vendor",
    "client_deciding",
    "awaiting_payment",
    "preparing",
    "at_hub",
    "out_for_delivery",
    "done",
  ],
};

export function isJobKind(value: string): value is JobKind {
  return value === "gift" || value === "kitchen" || value === "concierge";
}

export function formatJobMoney(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
