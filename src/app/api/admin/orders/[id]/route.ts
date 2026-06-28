import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { updateOrderAdmin } from "@/lib/admin/repository";
import { fetchOrderById } from "@/lib/orders/repository";
import { mapOrderRow } from "@/lib/orders/map";
import { createAdminClient } from "@/lib/supabase/admin";
import { markVendorItemQcPassed } from "@/lib/vendors/repository";

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

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await updateOrderAdmin(id, {
      status: body.status,
      paymentStatus: body.paymentStatus,
      paymentReference: body.paymentReference,
      trackingCarrier: body.trackingCarrier,
      trackingNumber: body.trackingNumber,
      trackingUrl: body.trackingUrl,
    });

    if (body.qcPassItemId) {
      await markVendorItemQcPassed(String(body.qcPassItemId));
    }

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
