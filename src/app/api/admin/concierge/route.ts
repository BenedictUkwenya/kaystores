import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  fetchConciergeRequests,
  updateConciergeRequest,
} from "@/lib/admin/repository";

export async function GET() {
  try {
    await requireAdmin();
    const requests = await fetchConciergeRequests();
    return Response.json({ requests });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    await updateConciergeRequest(String(body.id), {
      status: body.status,
      adminNotes: body.adminNotes,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
