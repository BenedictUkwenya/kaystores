import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { resendRoleInviteReminder } from "@/lib/admin/users";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Invite id is required" }, { status: 400 });
    }
    const result = await resendRoleInviteReminder(id);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
