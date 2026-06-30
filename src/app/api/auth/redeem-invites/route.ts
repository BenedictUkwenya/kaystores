import { apiErrorResponse, getSessionUser } from "@/lib/auth/roles";
import { redeemInvitesForUser } from "@/lib/admin/users";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    await redeemInvitesForUser(user.id, user.email);
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
