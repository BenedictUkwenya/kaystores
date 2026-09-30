import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotice } from "@/lib/email/notice";
import { getEmailSiteUrl } from "@/lib/site";
import { tableAccessPath } from "@/lib/orders/access";
import { getTableRequestById } from "@/lib/table/repository";
import { fetchConciergeRequestWithAssignments } from "@/lib/concierge/dispatch";
import { effectiveConciergeStage, selectedAssignment } from "@/lib/jobs/concierge";
import { getShippingHubById, nearestHubsForVendor } from "@/lib/shipping/hubs";
import type { FulfilmentStage } from "@/types/fulfilment";

export type HubJobKind = "kitchen" | "concierge";

export type HubStepAction =
  | "vendor_sent"
  | "hub_received"
  | "qc_pass"
  | "qc_fail"
  | "out_for_delivery"
  | "deliver";

export class HubStepError extends Error {
  status = 409;
}

const TABLE: Record<HubJobKind, "table_requests" | "concierge_requests"> = {
  kitchen: "table_requests",
  concierge: "concierge_requests",
};

const ALLOWED_FROM: Record<HubStepAction, FulfilmentStage[]> = {
  vendor_sent: ["awaiting_vendor"],
  // Admin can receive a parcel even if the vendor forgot to tap "I've sent it".
  hub_received: ["awaiting_vendor", "vendor_sent"],
  qc_pass: ["at_hub"],
  qc_fail: ["at_hub", "qc_passed"],
  out_for_delivery: ["qc_passed"],
  deliver: ["qc_passed", "out_for_delivery"],
};

const NEXT_STAGE: Record<HubStepAction, FulfilmentStage> = {
  vendor_sent: "vendor_sent",
  hub_received: "at_hub",
  qc_pass: "qc_passed",
  qc_fail: "awaiting_vendor",
  out_for_delivery: "out_for_delivery",
  deliver: "delivered",
};

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

type HubContext = {
  kind: HubJobKind;
  id: string;
  reference: string;
  label: string;
  paid: boolean;
  /** Stage as the job model sees it (includes the pre-045 concierge fallback). */
  stage: FulfilmentStage;
  /** Raw column value, used as the optimistic-lock guard. */
  storedStage: FulfilmentStage;
  pickup: boolean;
  hubName: string;
  clientName: string;
  clientEmail: string;
  vendorId: string | null;
  vendorName: string;
  assignmentId: string | null;
  clientUrl: string;
  vendorUrl: string;
  adminUrl: string;
};

async function loadContext(kind: HubJobKind, id: string): Promise<HubContext> {
  const site = getEmailSiteUrl();
  if (kind === "kitchen") {
    const r = await getTableRequestById(id);
    if (!r) throw Object.assign(new HubStepError("Request not found."), { status: 404 });
    return {
      kind,
      id,
      reference: r.reference,
      label: r.occasion ? `${r.category} for ${r.occasion}` : r.category,
      paid: r.paymentStatus === "paid",
      stage: r.fulfilmentStage,
      storedStage: r.fulfilmentStage,
      pickup: r.fulfillmentMethod === "pickup",
      hubName: r.dropoffHubName ?? r.pickupHubName ?? "the Kay hub",
      clientName: r.contactName,
      clientEmail: r.contactEmail,
      vendorId: r.assignedVendorId ?? null,
      vendorName: r.assignedVendorName ?? "The baker",
      assignmentId: null,
      clientUrl: `${site}${tableAccessPath(r.id)}`,
      vendorUrl: `${site}/vendor/jobs/kitchen/${r.id}`,
      adminUrl: `${site}/admin/jobs/kitchen/${r.id}`,
    };
  }
  const r = await fetchConciergeRequestWithAssignments(id);
  if (!r) throw Object.assign(new HubStepError("Request not found."), { status: 404 });
  const selected = selectedAssignment(r);
  return {
    kind,
    id,
    reference: r.referenceNumber,
    label: r.productName,
    paid: r.paymentStatus === "paid",
    stage: effectiveConciergeStage(r, selected),
    storedStage: r.fulfilmentStage,
    pickup: false,
    hubName: r.dropoffHubName ?? "the Kay hub",
    clientName: r.contactName,
    clientEmail: r.contactEmail,
    vendorId: selected?.vendorId ?? null,
    vendorName: selected?.vendorBusinessName ?? "The partner",
    assignmentId: selected?.id ?? null,
    clientUrl: `${site}/concierge/status/${r.id}`,
    vendorUrl: selected ? `${site}/vendor/jobs/concierge/${selected.id}` : `${site}/vendor`,
    adminUrl: `${site}/admin/jobs/concierge/${r.id}`,
  };
}

async function vendorEmail(vendorId: string | null): Promise<{ email: string; name: string } | null> {
  if (!vendorId) return null;
  const { data } = await db()
    .from("vendors")
    .select("contact_email, contact_name, business_name")
    .eq("id", vendorId)
    .maybeSingle();
  if (!data?.contact_email) return null;
  return {
    email: String(data.contact_email),
    name: String(data.contact_name || data.business_name || "there"),
  };
}

function migrationError(message: string) {
  return message.includes("fulfilment_stage") || message.includes("schema cache")
    ? new HubStepError("Run migration 045 in Supabase before using hub steps.")
    : new Error(message);
}

/**
 * Move a paid kitchen/concierge job one step along the hub route.
 * `vendorId` is set when a vendor (not an admin) is acting.
 */
export async function advanceHubStep(input: {
  kind: HubJobKind;
  id: string;
  action: HubStepAction;
  note?: string;
  vendorId?: string;
}): Promise<void> {
  const ctx = await loadContext(input.kind, input.id);
  if (!ctx.paid) throw new HubStepError("The client hasn't paid yet.");
  if (input.vendorId) {
    if (input.action !== "vendor_sent") throw new HubStepError("Only Kay can do that step.");
    if (input.vendorId !== ctx.vendorId) {
      throw Object.assign(new HubStepError("This job isn't assigned to you."), { status: 403 });
    }
  }
  if (!ALLOWED_FROM[input.action].includes(ctx.stage)) {
    throw new HubStepError("That step doesn't apply right now. Refresh the page.");
  }
  if (input.action === "deliver" && ctx.stage === "qc_passed" && !ctx.pickup) {
    throw new HubStepError("Send it out for delivery first.");
  }
  const note = input.note?.trim() ?? "";
  if (input.action === "qc_fail" && !note) {
    throw new HubStepError("Say what's wrong so the vendor can fix it.");
  }

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { fulfilment_stage: NEXT_STAGE[input.action] };
  switch (input.action) {
    case "vendor_sent":
      payload.vendor_sent_at = now;
      break;
    case "hub_received":
      payload.hub_received_at = now;
      break;
    case "qc_pass":
      payload.qc_passed_at = now;
      payload.qc_note = null;
      break;
    case "qc_fail":
      payload.qc_note = note;
      payload.vendor_sent_at = null;
      payload.hub_received_at = null;
      payload.qc_passed_at = null;
      break;
    case "out_for_delivery":
      payload.out_for_delivery_at = now;
      break;
    case "deliver":
      payload.delivered_at = now;
      payload.status = input.kind === "kitchen" ? "fulfilled" : "completed";
      break;
  }
  if (input.kind === "kitchen") payload.updated_at = now;
  if (input.kind === "concierge" && input.action === "vendor_sent") {
    payload.status = "in_fulfilment";
  }

  const { data: claimed, error } = await db()
    .from(TABLE[input.kind])
    .update(payload)
    .eq("id", input.id)
    .eq("fulfilment_stage", ctx.storedStage)
    .select("id");
  if (error) throw migrationError(error.message);
  if (!claimed?.length) throw new HubStepError("Someone else just updated this. Refresh the page.");

  if (input.kind === "concierge" && ctx.assignmentId) {
    const assignmentStatus: Partial<Record<HubStepAction, string>> = {
      vendor_sent: "at_hub",
      hub_received: "at_hub",
      qc_fail: "sourcing",
      deliver: "completed",
    };
    const next = assignmentStatus[input.action];
    if (next) {
      await db()
        .from("concierge_vendor_assignments")
        .update({ fulfilment_status: next })
        .eq("id", ctx.assignmentId)
        .then(() => undefined, () => undefined);
    }
  }

  await notifyHubStep(ctx, input.action, note).catch((err) =>
    console.error("[hub-steps notify]", err),
  );
}

async function notifyHubStep(ctx: HubContext, action: HubStepAction, note: string) {
  const service = ctx.kind === "kitchen" ? "Kay Kitchen" : "Kay Concierge";
  const type = ctx.kind === "kitchen" ? "kitchen_update" : "concierge_update";

  if (action === "vendor_sent") {
    await sendNotice({
      type: "admin_alert",
      toTeam: true,
      subject: `On its way to the hub — ${ctx.reference}`,
      title: "Vendor sent it to the hub",
      paragraphs: [
        `${ctx.vendorName} says ${ctx.reference} (${ctx.label}) is on its way to ${ctx.hubName}.`,
        "Mark it received when it arrives, then check it (quality check).",
      ],
      ctaUrl: ctx.adminUrl,
      ctaLabel: "Open the job",
    });
    return;
  }

  const vendor = await vendorEmail(ctx.vendorId);

  if (action === "hub_received" && vendor) {
    await sendNotice({
      type,
      to: [vendor.email],
      subject: `Received at the hub — ${ctx.reference}`,
      title: "Kay has it",
      paragraphs: [
        `Hi ${vendor.name},`,
        `${ctx.reference} arrived at ${ctx.hubName}. We'll check it and take it from here.`,
      ],
      ctaUrl: ctx.vendorUrl,
      ctaLabel: "View the job",
    });
    return;
  }

  if (action === "qc_fail" && vendor) {
    await sendNotice({
      type,
      to: [vendor.email],
      subject: `Needs redoing — ${ctx.reference}`,
      title: "It didn't pass Kay's quality check",
      paragraphs: [
        `Hi ${vendor.name},`,
        `${ctx.reference} didn't pass our check. Please fix it and send it back to ${ctx.hubName}, then tap "I've sent it" in your portal.`,
      ],
      quote: note,
      ctaUrl: ctx.vendorUrl,
      ctaLabel: "Open the job",
    });
    return;
  }

  if (action === "out_for_delivery" && ctx.clientEmail) {
    await sendNotice({
      type,
      to: [ctx.clientEmail],
      subject: `On its way — ${service} ${ctx.reference}`,
      title: "Your order is on its way",
      paragraphs: [
        `Hi ${ctx.clientName},`,
        "It passed our quality check and is now out for delivery. We'll let you know once it arrives.",
      ],
      ctaUrl: ctx.clientUrl,
      ctaLabel: "View your request",
    });
    return;
  }

  if (action === "deliver") {
    await Promise.all([
      ctx.clientEmail
        ? sendNotice({
            type,
            to: [ctx.clientEmail],
            subject: `Delivered — ${service} ${ctx.reference}`,
            title: ctx.pickup ? "Collected. Enjoy!" : "Delivered. Enjoy!",
            paragraphs: [
              `Hi ${ctx.clientName},`,
              "Your order is complete. We hope it made the moment special. Thank you for choosing Kay.",
            ],
            ctaUrl: ctx.clientUrl,
            ctaLabel: "View your request",
          })
        : Promise.resolve(),
      vendor
        ? sendNotice({
            type,
            to: [vendor.email],
            subject: `Delivered — ${ctx.reference}`,
            title: "Delivered to the client",
            paragraphs: [`Hi ${vendor.name},`, `${ctx.reference} reached the client. Thank you!`],
            ctaUrl: ctx.vendorUrl,
            ctaLabel: "View the job",
          })
        : Promise.resolve(),
    ]);
  }
}

function formatHubAddress(address: { line1?: string; city?: string; state?: string }): string {
  return [address.line1, address.city, address.state].filter(Boolean).join(", ");
}

/**
 * Pick where the vendor should drop the item once the client pays:
 * the client's pickup hub for kitchen pickups, else the hub nearest the vendor.
 * Best-effort — silently skipped before migration 045.
 */
export async function assignDropoffHub(kind: HubJobKind, id: string): Promise<void> {
  try {
    let vendorId: string | null = null;
    let pickupHubId: string | null = null;
    if (kind === "kitchen") {
      const r = await getTableRequestById(id);
      if (!r || r.dropoffHubId) return;
      vendorId = r.assignedVendorId ?? null;
      pickupHubId = r.fulfillmentMethod === "pickup" ? r.pickupHubId ?? null : null;
    } else {
      const r = await fetchConciergeRequestWithAssignments(id);
      if (!r || r.dropoffHubId) return;
      vendorId = selectedAssignment(r)?.vendorId ?? null;
    }

    let hub = pickupHubId ? await getShippingHubById(pickupHubId) : null;
    if (!hub) {
      let state: string | null = null;
      if (vendorId) {
        const { data } = await db()
          .from("vendors")
          .select("pickup_address")
          .eq("id", vendorId)
          .maybeSingle();
        state = (data?.pickup_address as { state?: string } | null)?.state ?? null;
      }
      hub = (await nearestHubsForVendor(state, 1))[0] ?? null;
    }
    if (!hub) return;

    await db()
      .from(TABLE[kind])
      .update({
        dropoff_hub_id: hub.id === "env-default" ? null : hub.id,
        dropoff_hub_name: hub.name,
        dropoff_hub_phone: hub.contactPhone,
        dropoff_hub_address: formatHubAddress(hub.address),
      })
      .eq("id", id);
  } catch (err) {
    console.error("[hub-steps] assignDropoffHub", err);
  }
}
