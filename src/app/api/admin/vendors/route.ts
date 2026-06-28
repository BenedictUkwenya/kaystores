import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const vendors = await fetchAllVendors(status);
    return Response.json({ vendors });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
