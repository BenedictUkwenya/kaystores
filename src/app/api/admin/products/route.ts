import { apiErrorResponse, requireAdmin, AuthError } from "@/lib/auth/roles";
import { fetchVendorById } from "@/lib/admin/repository";
import { prepareVendorProductInput } from "@/lib/products/vendor-placement";
import {
  createVendorProductAdmin,
  type VendorProductInput,
} from "@/lib/vendors/repository";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as VendorProductInput & {
      vendorId?: string;
    };
    const { vendorId, ...input } = body;
    const trimmedVendorId = vendorId?.trim();
    if (trimmedVendorId) {
      const vendor = await fetchVendorById(trimmedVendorId);
      if (!vendor || vendor.status !== "approved") {
        throw new AuthError("Approved vendor not found.", 404);
      }

      if (body.segment === "after_dark" && !vendor.canListAfterDark) {
        return Response.json(
          { error: "After Dark listings require trusted vendor status." },
          { status: 403 },
        );
      }
    }

    if (body.images && body.images.length > 3) {
      return Response.json(
        { error: "Maximum 3 product images allowed." },
        { status: 400 },
      );
    }

    const product = await createVendorProductAdmin(
      trimmedVendorId || null,
      prepareVendorProductInput(input),
    );
    return Response.json({ product });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
