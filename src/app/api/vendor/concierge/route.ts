import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import {
  fetchVendorConciergeItems,
  respondToConciergeAssignment,
} from "@/lib/concierge/dispatch";
import { uploadOfferImages } from "@/lib/storage/concierge-attachments";
import type { ConciergeVendorResponse } from "@/types/concierge";

const VALID_RESPONSES = new Set<ConciergeVendorResponse>([
  "has_product",
  "no_product",
  "need_more_info",
]);

export async function GET() {
  try {
    const { vendor } = await requireVendor();
    const items = await fetchVendorConciergeItems(vendor.id);
    return Response.json({ items });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { vendor } = await requireVendor();
    const contentType = request.headers.get("content-type") ?? "";

    let assignmentId = "";
    let requestId = "";
    let status: ConciergeVendorResponse = "pending";
    let vendorNotes = "";
    let quotedPrice: number | null = null;
    let imageFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      assignmentId = String(formData.get("assignmentId") ?? "");
      requestId = String(formData.get("requestId") ?? "");
      status = formData.get("status") as ConciergeVendorResponse;
      vendorNotes = String(formData.get("vendorNotes") ?? "");
      const priceRaw = formData.get("quotedPrice");
      quotedPrice =
        priceRaw != null && String(priceRaw).trim()
          ? Number(priceRaw)
          : null;
      imageFiles = formData
        .getAll("offerImages")
        .filter((f): f is File => f instanceof File && f.size > 0);
    } else {
      const body = await request.json();
      assignmentId = String(body.assignmentId ?? "");
      requestId = String(body.requestId ?? "");
      status = body.status as ConciergeVendorResponse;
      vendorNotes = body.vendorNotes ? String(body.vendorNotes) : "";
      quotedPrice =
        body.quotedPrice != null && body.quotedPrice !== ""
          ? Number(body.quotedPrice)
          : null;
    }

    if (!assignmentId || !requestId) {
      return Response.json(
        { error: "Assignment ID required" },
        { status: 400 },
      );
    }

    if (!VALID_RESPONSES.has(status)) {
      return Response.json({ error: "Invalid response status" }, { status: 400 });
    }

    if (quotedPrice != null && (Number.isNaN(quotedPrice) || quotedPrice < 1)) {
      return Response.json({ error: "Invalid quoted price" }, { status: 400 });
    }

    const responseStatus = status as Exclude<
      ConciergeVendorResponse,
      "pending"
    >;

    let offerImages;
    if (responseStatus === "has_product" && imageFiles.length > 0) {
      offerImages = await uploadOfferImages(
        requestId,
        assignmentId,
        imageFiles,
      );
    }

    await respondToConciergeAssignment({
      assignmentId,
      vendorId: vendor.id,
      requestId,
      status: responseStatus,
      vendorNotes,
      quotedPrice,
      offerImages,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
