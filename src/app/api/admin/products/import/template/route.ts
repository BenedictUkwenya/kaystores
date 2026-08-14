import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { IMPORT_TEMPLATE_CSV } from "@/lib/admin/product-import";

export async function GET() {
  try {
    await requireAdmin();
    return new Response(IMPORT_TEMPLATE_CSV, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kay-product-import.csv"',
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
