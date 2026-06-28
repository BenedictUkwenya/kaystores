import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchAllOrdersAdmin, updateOrderAdmin } from "@/lib/admin/repository";
import { mapOrderRow } from "@/lib/orders/map";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await fetchAllOrdersAdmin();
    return Response.json({ orders: rows.map((r) => mapOrderRow(r as never)) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
