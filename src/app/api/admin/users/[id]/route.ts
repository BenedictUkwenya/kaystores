import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  demoteUserToCustomer,
  promoteUserToVendor,
  updateUserAccountStatus,
  upgradeUserToAdmin,
} from "@/lib/admin/users";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const action = String(body.action ?? "");

    switch (action) {
      case "suspend":
        await updateUserAccountStatus(
          id,
          "suspended",
          ctx.userId,
          body.reason ? String(body.reason) : undefined,
        );
        break;
      case "block":
        await updateUserAccountStatus(
          id,
          "blocked",
          ctx.userId,
          body.reason ? String(body.reason) : undefined,
        );
        break;
      case "activate":
        await updateUserAccountStatus(id, "active", ctx.userId);
        break;
      case "make_admin":
        await upgradeUserToAdmin(id, ctx.userId);
        break;
      case "make_vendor":
        await promoteUserToVendor(
          id,
          ctx.userId,
          String(body.businessName ?? ""),
        );
        break;
      case "make_customer":
        await demoteUserToCustomer(id, ctx.userId);
        break;
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
