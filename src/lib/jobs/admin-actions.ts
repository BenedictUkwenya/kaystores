import { createAdminClient } from "@/lib/supabase/admin";
import {
  OrderActionError,
  adminCancel,
  adminDeliver,
  adminHubReceived,
  adminMarkPaid,
  adminMarkRefunded,
  adminQcFail,
  adminQcPass,
  adminShip,
} from "@/lib/orders/admin-actions";
import {
  HubStepError,
  advanceHubStep,
  type HubStepAction,
} from "@/lib/fulfilment/hub-steps";
import {
  getTableRequestById,
  updateTableRequest,
} from "@/lib/table/repository";
import { confirmTablePayment } from "@/lib/table/payment";
import {
  notifyTableQuoteReady,
  notifyTableStatusUpdate,
  notifyTableVendorAssigned,
} from "@/lib/email/table";
import {
  dispatchConciergeToVendors,
  fetchConciergeRequestWithAssignments,
  presentOfferToClient,
} from "@/lib/concierge/dispatch";
import { selectedAssignment } from "@/lib/jobs/concierge";
import { confirmConciergePayment } from "@/lib/payments/confirm";
import { markupPrice } from "@/lib/pricing/markup";
import type { JobKind } from "@/lib/jobs/types";
import type { TableRequestStatus } from "@/types/table";
import type { ConciergeRequestStatus } from "@/types/concierge";

export class JobActionError extends Error {
  status = 409;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

export type JobActionBody = {
  action?: string;
  itemId?: string;
  note?: string;
  reason?: string;
  reference?: string;
  vendorId?: string;
  vendorIds?: string[] | "all";
  assignmentId?: string;
  amount?: number | string;
  status?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

const HUB_ACTIONS = new Set<HubStepAction>([
  "hub_received",
  "qc_pass",
  "qc_fail",
  "out_for_delivery",
  "deliver",
]);

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

function requireReference(body: JobActionBody): string {
  const ref = String(body.reference ?? "").trim();
  if (!ref) throw new JobActionError("Add the bank or Paystack reference.", 400);
  return ref.slice(0, 100);
}

async function runGift(id: string, body: JobActionBody) {
  const itemId = String(body.itemId ?? "");
  switch (body.action) {
    case "mark_paid":
      return adminMarkPaid(id, requireReference(body));
    case "hub_received":
      return adminHubReceived(id, itemId);
    case "qc_pass":
      return adminQcPass(id, itemId);
    case "qc_fail":
      if (!String(body.note ?? "").trim()) {
        throw new JobActionError("Say what's wrong so the vendor can fix it.", 400);
      }
      return adminQcFail(id, itemId, String(body.note));
    case "ship":
      return adminShip(id, {
        carrier: body.trackingCarrier,
        number: body.trackingNumber,
        url: body.trackingUrl,
      });
    case "deliver":
      return adminDeliver(id);
    case "cancel":
      return adminCancel(id, String(body.reason ?? ""));
    case "mark_refunded":
      return adminMarkRefunded(id, requireReference(body));
    default:
      throw new JobActionError("Unknown action.", 400);
  }
}

const KITCHEN_STATUSES = new Set<TableRequestStatus>([
  "submitted",
  "reviewing",
  "quoted",
  "accepted",
  "declined",
  "fulfilled",
]);

async function runKitchen(id: string, body: JobActionBody) {
  const action = body.action ?? "";
  if (HUB_ACTIONS.has(action as HubStepAction)) {
    return advanceHubStep({ kind: "kitchen", id, action: action as HubStepAction, note: body.note });
  }
  const before = await getTableRequestById(id);
  if (!before) throw new JobActionError("Request not found.", 404);
  const open = before.paymentStatus === "unpaid" && ["submitted", "reviewing", "quoted"].includes(before.status);

  switch (action) {
    case "assign_vendor": {
      const vendorId = String(body.vendorId ?? "");
      if (!vendorId) throw new JobActionError("Pick a baker.", 400);
      if (!open) throw new JobActionError("You can only change the baker before the client pays.");
      const changed = vendorId !== before.assignedVendorId;
      const updated = await updateTableRequest(id, {
        assignedVendorId: vendorId,
        status: before.status === "quoted" ? "quoted" : "reviewing",
        ...(changed ? { vendorQuoteAmount: null, vendorQuoteNote: null } : {}),
      });
      if (changed) {
        const { data: vendor } = await db()
          .from("vendors")
          .select("contact_name, contact_email, business_name")
          .eq("id", vendorId)
          .maybeSingle();
        if (vendor?.contact_email) {
          await notifyTableVendorAssigned(
            {
              contactName: String(vendor.contact_name || "Partner"),
              contactEmail: String(vendor.contact_email),
              businessName: String(vendor.business_name || "Baker"),
            },
            updated,
          ).catch((err) => console.error("[jobs] vendor assigned email", err));
        }
      }
      return;
    }
    case "send_quote": {
      const amount = Math.round(Number(body.amount));
      if (!Number.isFinite(amount) || amount < 1) {
        throw new JobActionError("Enter the client price in naira.", 400);
      }
      if (!open) throw new JobActionError("This request is no longer open for quoting.");
      const wasQuoted = before.status === "quoted";
      const updated = await updateTableRequest(id, {
        quoteAmount: amount,
        quoteNote: String(body.note ?? "").trim().slice(0, 1000) || null,
        status: "quoted",
      });
      await (wasQuoted ? notifyTableQuoteReady(updated) : notifyTableStatusUpdate(updated)).catch(
        (err) => console.error("[jobs] quote email", err),
      );
      return;
    }
    case "mark_paid": {
      if (before.status !== "quoted" || !before.quoteAmount) {
        throw new JobActionError("Send the client a quote before marking it paid.");
      }
      await confirmTablePayment(id, `manual ${requireReference(body)}`.slice(0, 120));
      return;
    }
    case "decline": {
      if (before.paymentStatus === "paid") {
        throw new JobActionError("The client has paid. Refund them before declining.");
      }
      const updated = await updateTableRequest(id, { status: "declined" });
      await notifyTableStatusUpdate(updated).catch(() => undefined);
      return;
    }
    case "mark_refunded": {
      if (before.paymentStatus !== "paid") throw new JobActionError("Nothing was paid.");
      await db()
        .from("table_requests")
        .update({
          payment_status: "refunded",
          status: "declined",
          payment_reference: `${before.paymentReference ?? ""} · refund ${requireReference(body)}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      return;
    }
    case "set_status": {
      const status = body.status as TableRequestStatus;
      if (!KITCHEN_STATUSES.has(status)) throw new JobActionError("Unknown status.", 400);
      const updated = await updateTableRequest(id, { status });
      if (status !== before.status && status !== "submitted") {
        await notifyTableStatusUpdate(updated).catch(() => undefined);
      }
      return;
    }
    default:
      throw new JobActionError("Unknown action.", 400);
  }
}

const CONCIERGE_STATUSES = new Set<ConciergeRequestStatus>([
  "pending",
  "with_vendors",
  "offers_ready",
  "client_reviewing",
  "revision_requested",
  "vendor_selected",
  "in_fulfilment",
  "completed",
  "closed",
]);

async function runConcierge(id: string, body: JobActionBody) {
  const action = body.action ?? "";
  if (HUB_ACTIONS.has(action as HubStepAction)) {
    return advanceHubStep({ kind: "concierge", id, action: action as HubStepAction, note: body.note });
  }
  const request = await fetchConciergeRequestWithAssignments(id);
  if (!request) throw new JobActionError("Request not found.", 404);

  switch (action) {
    case "dispatch": {
      const vendorIds = body.vendorIds === "all" ? "all" : (body.vendorIds ?? []).map(String);
      await dispatchConciergeToVendors({ requestId: id, vendorIds });
      return;
    }
    case "present_offer": {
      const assignmentId = String(body.assignmentId ?? "");
      if (!assignmentId) throw new JobActionError("Pick an offer.", 400);
      await presentOfferToClient({ requestId: id, assignmentId });
      return;
    }
    case "mark_paid": {
      const selected = selectedAssignment(request);
      if (!selected || selected.quotedPrice == null) {
        throw new JobActionError("The client hasn't accepted an offer yet.");
      }
      if (request.paymentStatus === "paid") return;
      const reference = requireReference(body);
      if (request.paymentAmount == null) {
        await db()
          .from("concierge_requests")
          .update({ payment_amount: await markupPrice(selected.quotedPrice) })
          .eq("id", id);
      }
      await confirmConciergePayment(id, `manual ${reference}`.slice(0, 120));
      return;
    }
    case "close": {
      if (request.paymentStatus === "paid") {
        throw new JobActionError("The client has paid. Refund them before closing.");
      }
      await db()
        .from("concierge_requests")
        .update({
          status: "closed",
          admin_notes: String(body.reason ?? "").trim() || request.adminNotes || null,
        })
        .eq("id", id);
      return;
    }
    case "mark_refunded": {
      if (request.paymentStatus !== "paid") throw new JobActionError("Nothing was paid.");
      await db()
        .from("concierge_requests")
        .update({ payment_status: "refunded", status: "closed" })
        .eq("id", id);
      return;
    }
    case "set_status": {
      const status = body.status as ConciergeRequestStatus;
      if (!CONCIERGE_STATUSES.has(status)) throw new JobActionError("Unknown status.", 400);
      await db().from("concierge_requests").update({ status }).eq("id", id);
      return;
    }
    default:
      throw new JobActionError("Unknown action.", 400);
  }
}

export async function runAdminJobAction(kind: JobKind, id: string, body: JobActionBody) {
  try {
    if (kind === "gift") return await runGift(id, body);
    if (kind === "kitchen") return await runKitchen(id, body);
    return await runConcierge(id, body);
  } catch (err) {
    if (err instanceof OrderActionError || err instanceof HubStepError) {
      throw new JobActionError(err.message, err.status);
    }
    throw err;
  }
}
