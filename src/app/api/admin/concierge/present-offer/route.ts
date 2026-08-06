import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { presentOfferToClient } from "@/lib/concierge/dispatch";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const requestId = String(body.requestId ?? "");
    const assignmentId = String(body.assignmentId ?? "");

    if (!requestId || !assignmentId) {
      return Response.json(
        { error: "Request and offer are required." },
        { status: 400 },
      );
    }

    await presentOfferToClient({ requestId, assignmentId });
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
