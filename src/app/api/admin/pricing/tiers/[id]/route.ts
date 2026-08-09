import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { deleteMarkupTier, updateMarkupTier } from "@/lib/admin/pricing";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const tier = await updateMarkupTier(id, {
      minPrice: body.minPrice != null ? Number(body.minPrice) : undefined,
      maxPrice:
        body.maxPrice === undefined
          ? undefined
          : body.maxPrice === null || body.maxPrice === ""
            ? null
            : Number(body.maxPrice),
      ratePercent:
        body.ratePercent != null ? Number(body.ratePercent) : undefined,
      flatFee: body.flatFee != null ? Number(body.flatFee) : undefined,
      label: body.label !== undefined ? String(body.label ?? "") : undefined,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      active: body.active !== undefined ? Boolean(body.active) : undefined,
    });
    return Response.json({ tier });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await deleteMarkupTier(id);
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
