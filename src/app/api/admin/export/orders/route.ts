import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { exportOrdersCsv } from "@/lib/admin/repository";

export async function GET() {
  try {
    await requireAdmin();
    const csv = await exportOrdersCsv();
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="kay-orders.csv"',
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
