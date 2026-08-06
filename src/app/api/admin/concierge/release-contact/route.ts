import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { releaseClientContact } from "@/lib/concierge/dispatch";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const requestId = String(body.requestId ?? "");
    if (!requestId) {
      return Response.json({ error: "Request ID required" }, { status: 400 });
    }
    await releaseClientContact(requestId);
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
