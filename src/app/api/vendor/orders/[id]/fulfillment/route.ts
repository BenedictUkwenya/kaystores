import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { updateVendorFulfillment } from "@/lib/vendors/repository";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { vendor } = await requireVendor();
    const { id } = await params;
    const body = await request.json();
    await updateVendorFulfillment(id, vendor.id, {
      fulfillmentStatus: body.fulfillmentStatus,
      hubNotes: body.hubNotes,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
