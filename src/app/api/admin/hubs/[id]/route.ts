import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { deleteShippingHub, updateShippingHub } from "@/lib/shipping/hubs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const hub = await updateShippingHub(id, {
      name: body.name != null ? String(body.name) : undefined,
      slug: body.slug != null ? String(body.slug) : undefined,
      address: body.address
        ? {
            line1: String(body.address.line1 ?? ""),
            line2: body.address.line2 ? String(body.address.line2) : undefined,
            city: String(body.address.city ?? ""),
            state: String(body.address.state ?? ""),
            postalCode: body.address.postalCode
              ? String(body.address.postalCode)
              : undefined,
            country: String(body.address.country ?? "Nigeria"),
          }
        : undefined,
      contactName:
        body.contactName != null ? String(body.contactName) : undefined,
      contactEmail:
        body.contactEmail != null ? String(body.contactEmail) : undefined,
      contactPhone:
        body.contactPhone != null ? String(body.contactPhone) : undefined,
      serviceStates: Array.isArray(body.serviceStates)
        ? body.serviceStates.map(String)
        : body.serviceStatesText != null
          ? String(body.serviceStatesText)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      isDefault: body.isDefault != null ? Boolean(body.isDefault) : undefined,
      isActive: body.isActive != null ? Boolean(body.isActive) : undefined,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
    });
    return Response.json({ hub });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteShippingHub(id);
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
