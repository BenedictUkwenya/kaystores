import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  createShippingHub,
  listShippingHubs,
} from "@/lib/shipping/hubs";

export async function GET() {
  try {
    await requireAdmin();
    const hubs = await listShippingHubs();
    return Response.json({ hubs });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const hub = await createShippingHub({
      name: String(body.name ?? ""),
      slug: body.slug != null ? String(body.slug) : undefined,
      address: {
        line1: String(body.address?.line1 ?? ""),
        line2: body.address?.line2 ? String(body.address.line2) : undefined,
        city: String(body.address?.city ?? ""),
        state: String(body.address?.state ?? ""),
        postalCode: body.address?.postalCode
          ? String(body.address.postalCode)
          : undefined,
        country: String(body.address?.country ?? "Nigeria"),
      },
      contactName: String(body.contactName ?? ""),
      contactEmail: String(body.contactEmail ?? ""),
      contactPhone: String(body.contactPhone ?? ""),
      serviceStates: Array.isArray(body.serviceStates)
        ? body.serviceStates.map(String)
        : String(body.serviceStatesText ?? "")
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
      isDefault: Boolean(body.isDefault),
      isActive: body.isActive !== false,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : 0,
    });
    return Response.json({ hub });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
