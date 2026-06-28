import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  approveVendor,
  rejectVendor,
  suspendVendor,
  fetchVendorById,
} from "@/lib/admin/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyVendorApproved } from "@/lib/email/vendor";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const action = String(body.action);

    switch (action) {
      case "approve":
        await approveVendor(id, ctx.userId, Boolean(body.canListAfterDark));
        {
          const vendor = await fetchVendorById(id);
          if (vendor) {
            await notifyVendorApproved({
              contactName: vendor.contactName,
              contactEmail: vendor.contactEmail,
              businessName: vendor.businessName,
            });
          }
        }
        break;
      case "reject":
        await rejectVendor(id);
        break;
      case "suspend":
        await suspendVendor(id);
        break;
      case "toggle_trusted": {
        const admin = createAdminClient();
        if (!admin) throw new Error("Admin not configured");
        await admin
          .from("vendors")
          .update({ can_list_after_dark: Boolean(body.canListAfterDark) })
          .eq("id", id);
        break;
      }
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
