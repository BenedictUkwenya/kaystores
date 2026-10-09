import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { deleteFeaturedSlot } from "@/lib/ai/featured";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await deleteFeaturedSlot(id);
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
