import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
import { arrangeTerminalShipment } from "@/lib/shipping/terminal";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await fetchOrderById(id);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.paymentStatus !== "paid") {
      return Response.json({ error: "Payment must be confirmed before dispatch." }, { status: 409 });
    }
    const admin = createAdminClient();
    const { data: outstanding, error } = await admin!
      .from("vendor_order_items")
      .select("id")
      .eq("order_id", id)
      .neq("fulfillment_status", "qc_passed")
      .limit(1);
    if (error) throw error;
    if (outstanding?.length) {
      return Response.json(
        { error: "All vendor items must pass hub quality control before dispatch." },
        { status: 409 },
      );
    }
    await arrangeTerminalShipment(order);
    return Response.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
