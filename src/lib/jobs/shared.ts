import type { FulfilmentStage } from "@/types/fulfilment";
import type {
  JobActor,
  JobQuickAction,
  JobStage,
  JobUrgency,
} from "@/lib/jobs/types";

const HOUR = 60 * 60 * 1000;

export function hoursSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? (Date.now() - t) / HOUR : 0;
}

/** Overdue once the needed-by day has passed; due soon within two days. */
export function urgencyFromDeadline(
  neededBy: string | null | undefined,
): JobUrgency {
  if (!neededBy) return "normal";
  const due = new Date(`${neededBy.slice(0, 10)}T23:59:59`).getTime();
  if (!Number.isFinite(due)) return "normal";
  const left = due - Date.now();
  if (left < 0) return "overdue";
  if (left < 48 * HOUR) return "soon";
  return "normal";
}

export function urgencyFromAge(
  iso: string | null | undefined,
  soonAfterHours: number,
  overdueAfterHours: number,
): JobUrgency {
  const h = hoursSince(iso);
  if (h >= overdueAfterHours) return "overdue";
  if (h >= soonAfterHours) return "soon";
  return "normal";
}

export function worstUrgency(...values: JobUrgency[]): JobUrgency {
  if (values.includes("overdue")) return "overdue";
  if (values.includes("soon")) return "soon";
  return "normal";
}

type HubStepResult = {
  stage: JobStage;
  actor: JobActor;
  nextStep: string;
  quickAction?: JobQuickAction;
};

/** After payment, kitchen and concierge jobs follow the same hub route as gifts. */
export function hubStepNext(input: {
  stage: FulfilmentStage;
  vendorName: string;
  hubName?: string | null;
  pickup?: boolean;
  qcNote?: string | null;
}): HubStepResult {
  const hub = input.hubName || "the Kay hub";
  switch (input.stage) {
    case "awaiting_vendor":
      return {
        stage: "preparing",
        actor: "vendor",
        nextStep: input.qcNote
          ? `Failed quality check ("${input.qcNote}"). ${input.vendorName} is redoing it and sending it back to ${hub}.`
          : `Paid. ${input.vendorName} is making it and will send it to ${hub}.`,
      };
    case "vendor_sent":
      return {
        stage: "preparing",
        actor: "admin",
        nextStep: `${input.vendorName} says it's on the way to ${hub}. Mark it received when it arrives.`,
        quickAction: { action: "hub_received", label: "Mark received at hub" },
      };
    case "at_hub":
      return {
        stage: "at_hub",
        actor: "admin",
        nextStep: "It's at the hub. Check it looks right (quality check).",
        quickAction: { action: "qc_pass", label: "Passed quality check" },
      };
    case "qc_passed":
      return input.pickup
        ? {
            stage: "at_hub",
            actor: "admin",
            nextStep: "Passed quality check. Hand it over when the client collects.",
            quickAction: {
              action: "deliver",
              label: "Mark collected",
              confirm: "Mark this as collected by the client? They'll get a delivered email.",
            },
          }
        : {
            stage: "at_hub",
            actor: "admin",
            nextStep: "Passed quality check. Send it out for delivery.",
            quickAction: {
              action: "out_for_delivery",
              label: "Sent out for delivery",
              confirm: "Mark as out for delivery? The client will be emailed.",
            },
          };
    case "out_for_delivery":
      return {
        stage: "out_for_delivery",
        actor: "admin",
        nextStep: "On its way to the client. Mark delivered when it arrives.",
        quickAction: {
          action: "deliver",
          label: "Mark delivered",
          confirm: "Mark as delivered? The client will be emailed.",
        },
      };
    case "delivered":
    default:
      return { stage: "done", actor: "none", nextStep: "Delivered." };
  }
}
