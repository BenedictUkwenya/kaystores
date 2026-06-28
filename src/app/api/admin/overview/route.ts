import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchAdminOverview } from "@/lib/admin/repository";

export async function GET() {
  try {
    await requireAdmin();
    const overview = await fetchAdminOverview();
    return Response.json(overview);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
