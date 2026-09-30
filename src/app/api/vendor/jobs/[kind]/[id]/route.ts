import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { isJobKind } from "@/lib/jobs/labels";
import { updateVendorFulfillment } from "@/lib/vendors/repository";
import { HubStepError, advanceHubStep } from "@/lib/fulfilment/hub-steps";
import { fetchVendorConciergeAssignments } from "@/lib/concierge/dispatch";
import { VendorQuoteError, submitVendorKitchenQuote } from "@/lib/table/vendor-quote";

type Ctx = { params: Promise<{ kind: string; id: string }> };

type Body = {
  action?: string;
  hubId?: string;
  notes?: string;
  amount?: number | string;
  note?: string;
};

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { vendor } = await requireVendor();
    const { kind, id } = await params;
    if (!isJobKind(kind)) {
      return Response.json({ error: "Unknown job type." }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as Body;

    if (kind === "gift") {
      if (body.action === "choose_hub") {
        await updateVendorFulfillment(id, vendor.id, {
          selectedHubId: String(body.hubId ?? ""),
          hubNotes: body.notes,
        });
      } else if (body.action === "vendor_sent") {
        await updateVendorFulfillment(id, vendor.id, {
          fulfillmentStatus: "at_hub",
          hubNotes: body.notes,
        });
      } else {
        return Response.json({ error: "Unknown action." }, { status: 400 });
      }
      return Response.json({ ok: true });
    }

    if (kind === "kitchen") {
      if (body.action === "send_price") {
        await submitVendorKitchenQuote({
          vendorId: vendor.id,
          requestId: id,
          amount: body.amount,
          note: body.note,
        });
      } else if (body.action === "vendor_sent") {
        await advanceHubStep({ kind: "kitchen", id, action: "vendor_sent", vendorId: vendor.id });
      } else {
        return Response.json({ error: "Unknown action." }, { status: 400 });
      }
      return Response.json({ ok: true });
    }

    if (body.action !== "vendor_sent") {
      return Response.json({ error: "Unknown action." }, { status: 400 });
    }
    const [row] = await fetchVendorConciergeAssignments(vendor.id, id);
    if (!row) return Response.json({ error: "Job not found." }, { status: 404 });
    await advanceHubStep({
      kind: "concierge",
      id: row.request.id,
      action: "vendor_sent",
      vendorId: vendor.id,
    });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof HubStepError || err instanceof VendorQuoteError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return apiErrorResponse(err);
  }
}
