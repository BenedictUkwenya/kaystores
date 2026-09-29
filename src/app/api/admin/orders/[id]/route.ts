import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await fetchOrderById(id);
    if (!order) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data: vendorItems } = await admin
      ?.from("vendor_order_items")
      .select("*")
      .eq("order_id", id) ?? { data: [] };

    return Response.json({ order, vendorItems: vendorItems ?? [] });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

type Body = {
  action?: string;
  itemId?: string;
  reference?: string;
  reason?: string;
  note?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  /** Legacy QC button. */
  qcPassItemId?: string;
};

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Body;
    const action = body.action ?? (body.qcPassItemId ? "qc_pass" : "");
    const itemId = String(body.itemId ?? body.qcPassItemId ?? "");

    switch (action) {
      case "mark_paid":
        await adminMarkPaid(id, body.reference ?? "");
        break;
      case "hub_received":
        await adminHubReceived(id, itemId);
        break;
      case "qc_pass":
        await adminQcPass(id, itemId);
        break;
      case "qc_fail":
        await adminQcFail(id, itemId, body.note ?? "");
        break;
      case "ship":
        await adminShip(id, {
          carrier: body.trackingCarrier,
          number: body.trackingNumber,
          url: body.trackingUrl,
        });
        break;
      case "deliver":
        await adminDeliver(id);
        break;
      case "cancel":
        await adminCancel(id, body.reason ?? "");
        break;
      case "mark_refunded":
        await adminMarkRefunded(id, body.reference ?? "");
        break;
      default:
        return Response.json({ error: "Unknown action." }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof OrderActionError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return apiErrorResponse(err);
  }
}
