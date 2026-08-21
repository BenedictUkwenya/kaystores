import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { updateVendorProfile } from "@/lib/vendors/repository";

export async function GET() {
  try {
    const ctx = await requireVendor();
    return Response.json({ vendor: ctx.vendor });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { vendor } = await requireVendor();
    const body = await request.json();
    const updated = await updateVendorProfile(vendor.id, {
      businessName: body.businessName,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      catalogDescription: body.catalogDescription,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      pickupAddress: body.pickupAddress,
      returnAddress: body.returnAddress,
    });
    return Response.json({ vendor: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
