import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { updateConciergeFulfilment } from "@/lib/concierge/dispatch";
import type { ConciergeFulfilmentStatus } from "@/types/concierge";

const VALID = new Set<ConciergeFulfilmentStatus>([
  "sourcing",
  "at_hub",
  "completed",
]);

export async function PATCH(request: Request) {
  try {
    const { vendor } = await requireVendor();
    const body = await request.json();
    const assignmentId = String(body.assignmentId ?? "");
    const fulfilmentStatus = body.fulfilmentStatus as ConciergeFulfilmentStatus;

    if (!assignmentId || !VALID.has(fulfilmentStatus)) {
      return Response.json({ error: "Invalid fulfilment update" }, { status: 400 });
    }

    await updateConciergeFulfilment({
      assignmentId,
      vendorId: vendor.id,
      fulfilmentStatus,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
