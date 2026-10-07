import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { InviteEmailError, inviteUserByRole } from "@/lib/admin/users";

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    const body = await request.json();
    const role = body.role === "vendor" ? "vendor" : "admin";
    const email = String(body.email ?? "").trim();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await inviteUserByRole({
      email,
      role,
      businessName: body.businessName ? String(body.businessName) : undefined,
      inviteMode:
        body.inviteMode === "instant"
          ? "instant"
          : body.inviteMode === "profile"
            ? "profile"
            : undefined,
      invitedBy: ctx.userId,
    });

    return Response.json(result);
  } catch (err) {
    if (err instanceof InviteEmailError) {
      return Response.json(
        { error: err.message, inviteUrl: err.inviteUrl },
        { status: 502 },
      );
    }
    return apiErrorResponse(err);
  }
}
