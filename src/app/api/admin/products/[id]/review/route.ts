import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { reviewProduct } from "@/lib/admin/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyProductReview } from "@/lib/email/vendor";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    await reviewProduct(
      id,
      Boolean(body.approved),
      ctx.userId,
      body.rejectionReason,
    );

    const admin = createAdminClient();
    const { data: product } = await admin
      ?.from("products")
      .select("name, vendors(contact_name, contact_email, business_name)")
      .eq("id", id)
      .maybeSingle() ?? { data: null };

    const vendorsRaw = product?.vendors;
    const vendors = Array.isArray(vendorsRaw) ? vendorsRaw[0] : vendorsRaw;

    if (vendors && product?.name) {
      await notifyProductReview(
        {
          contactName: String(vendors.contact_name),
          contactEmail: String(vendors.contact_email),
          businessName: String(vendors.business_name),
        },
        String(product.name),
        Boolean(body.approved),
        body.rejectionReason,
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
