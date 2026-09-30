/**
 * A "job" is anything Kay is brokering between a client and a vendor:
 * a gift order, a Kay Kitchen cake request or a concierge sourcing request.
 * Every job is at one stage and has exactly one party whose turn it is.
 */
export type JobKind = "gift" | "kitchen" | "concierge";

export type JobStage =
  | "new"
  | "with_vendor"
  | "client_deciding"
  | "awaiting_payment"
  | "preparing"
  | "at_hub"
  | "out_for_delivery"
  | "done"
  | "cancelled";

export type JobActor = "admin" | "vendor" | "client" | "none";

export type JobUrgency = "overdue" | "soon" | "normal";

/** One-click admin action that needs no extra input (safe to show inline). */
export type JobQuickAction = {
  action: string;
  label: string;
  itemId?: string;
  /** Ask before running — used for anything the client will be emailed about. */
  confirm?: string;
};

export type Job = {
  key: string;
  kind: JobKind;
  id: string;
  reference: string;
  title: string;
  subtitle: string;
  clientName: string;
  vendorNames: string[];
  stage: JobStage;
  actor: JobActor;
  nextStep: string;
  quickAction?: JobQuickAction;
  urgency: JobUrgency;
  neededBy?: string | null;
  /** What the client pays Kay. */
  clientAmount?: number | null;
  /** What Kay pays the vendor(s). */
  vendorAmount?: number | null;
  paid: boolean;
  createdAt: string;
  href: string;
};

export type VendorJobTab = "todo" | "in_progress" | "done";

/** A vendor's slice of a job — never includes client contact or Kay's margin. */
export type VendorJob = {
  key: string;
  kind: JobKind;
  /** Gift: order item id. Concierge: assignment id. Kitchen: request id. */
  id: string;
  reference: string;
  title: string;
  subtitle: string;
  tab: VendorJobTab;
  stage: JobStage;
  nextStep: string;
  urgency: JobUrgency;
  /** What the vendor earns / quoted. */
  amount?: number | null;
  neededBy?: string | null;
  createdAt: string;
  href: string;
};
