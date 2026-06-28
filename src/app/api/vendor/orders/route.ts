import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { fetchVendorOrderItems, updateVendorFulfillment } from "@/lib/vendors/repository";

export async function GET() {
  try {
    const { vendor } = await requireVendor();
    const items = await fetchVendorOrderItems(vendor.id);
    return Response.json({ items });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
