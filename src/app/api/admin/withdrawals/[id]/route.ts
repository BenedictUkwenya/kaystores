import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { updateWithdrawal, fetchVendorById } from "@/lib/admin/repository";
import { notifyWithdrawalUpdate } from "@/lib/email/vendor";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    await updateWithdrawal(id, {
      status: body.status,
      adminNote: body.adminNote,
      paymentReference: body.paymentReference,
    });

    const admin = createAdminClient();
    const { data: withdrawal } = await admin
      ?.from("withdrawal_requests")
      .select("amount, vendor_id")
      .eq("id", id)
      .maybeSingle() ?? { data: null };

    if (withdrawal) {
      const vendor = await fetchVendorById(String(withdrawal.vendor_id));
      if (vendor) {
        await notifyWithdrawalUpdate(
          {
            contactName: vendor.contactName,
            contactEmail: vendor.contactEmail,
            businessName: vendor.businessName,
          },
          Number(withdrawal.amount),
          String(body.status),
        );
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
