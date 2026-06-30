import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { prepareVendorProductInput } from "@/lib/products/vendor-placement";
import {
  updateVendorProduct,
  type VendorProductInput,
} from "@/lib/vendors/repository";
import { createClient } from "@/lib/supabase/server";
import { mapProductRow } from "@/types/product";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { vendor } = await requireVendor();
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .maybeSingle();
    if (error || !data) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json({ product: mapProductRow(data) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { vendor } = await requireVendor();
    const { id } = await params;
    const body = (await request.json()) as Partial<VendorProductInput>;

    if (body.segment === "after_dark" && !vendor.canListAfterDark) {
      return Response.json(
        { error: "After Dark listings require trusted vendor status." },
        { status: 403 },
      );
    }

    if (body.images && body.images.length > 3) {
      return Response.json(
        { error: "Maximum 3 product images allowed." },
        { status: 400 },
      );
    }

    const product = await updateVendorProduct(
      id,
      vendor.id,
      prepareVendorProductInput(body as VendorProductInput),
    );
    return Response.json({ product });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
