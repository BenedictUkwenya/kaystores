import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
import { arrangeTerminalShipment } from "@/lib/shipping/terminal";
import { OrderActionError, assertReadyToShip } from "@/lib/orders/admin-actions";
import { notifyOrderShipped } from "@/lib/orders/notify";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await fetchOrderById(id);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    await assertReadyToShip(order);
    await arrangeTerminalShipment(order);

    const shipped = await fetchOrderById(id);
    if (shipped && order.status !== "shipped") {
      await notifyOrderShipped(shipped, {
        carrier: shipped.tracking?.carrier,
        number: shipped.tracking?.number,
        url: shipped.tracking?.url,
      }).catch(() => undefined);
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof OrderActionError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return apiErrorResponse(error);
  }
}
