import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { dispatchConciergeToVendors } from "@/lib/concierge/dispatch";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const requestId = String(body.requestId ?? "");
    const vendorIds = body.vendorIds;

    if (!requestId) {
      return Response.json({ error: "Request ID required" }, { status: 400 });
    }

    if (vendorIds !== "all" && (!Array.isArray(vendorIds) || !vendorIds.length)) {
      return Response.json(
        { error: "Select vendors or choose send to all" },
        { status: 400 },
      );
    }

    const result = await dispatchConciergeToVendors({
      requestId,
      vendorIds: vendorIds === "all" ? "all" : vendorIds.map(String),
    });

    return Response.json(result);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
