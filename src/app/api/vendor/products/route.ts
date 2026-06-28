import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import {
  createVendorProduct,
  fetchVendorProducts,
  type VendorProductInput,
} from "@/lib/vendors/repository";

export async function GET() {
  try {
    const { vendor } = await requireVendor();
    const products = await fetchVendorProducts(vendor.id);
    return Response.json({ products });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { vendor } = await requireVendor();
    const body = (await request.json()) as VendorProductInput;

    if (body.segment === "after_dark" && !vendor.canListAfterDark) {
      return Response.json(
        { error: "After Dark listings require trusted vendor status." },
        { status: 403 },
      );
    }

    const product = await createVendorProduct(vendor.id, body);
    return Response.json({ product });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
