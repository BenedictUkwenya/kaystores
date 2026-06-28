import { getSiteUrl } from "@/lib/site";
import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { createVendorInvite } from "@/lib/admin/repository";

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    const body = await request.json();
    const result = await createVendorInvite({
      email: String(body.email),
      businessName: String(body.businessName),
      invitedBy: ctx.userId,
    });
    return Response.json({
      ...result,
      applyUrl: `${getSiteUrl()}/vendor/apply?token=${result.token}`,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
