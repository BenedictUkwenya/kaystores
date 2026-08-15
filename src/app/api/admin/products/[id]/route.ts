import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchVendorById } from "@/lib/admin/repository";
import { prepareVendorProductInput } from "@/lib/products/vendor-placement";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateVendorProduct,
  type VendorProductInput,
} from "@/lib/vendors/repository";
import { mapProductRow } from "@/types/product";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const admin = createAdminClient();
    if (!admin) throw new Error("Database is not configured.");
    const { data, error } = await admin
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    return Response.json({ product: mapProductRow(data) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Partial<VendorProductInput>;
    if (body.images && body.images.length > 3) {
      return Response.json(
        { error: "Maximum 3 product images allowed." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    if (!admin) throw new Error("Database is not configured.");
    const { data, error } = await admin
      .from("products")
      .select("vendor_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    if (body.segment === "after_dark" && data.vendor_id) {
      const vendor = await fetchVendorById(String(data.vendor_id));
      if (!vendor?.canListAfterDark) {
        return Response.json(
          { error: "After Dark listings require trusted vendor status." },
          { status: 403 },
        );
      }
    }

    const product = await updateVendorProduct(
      id,
      data.vendor_id ? String(data.vendor_id) : null,
      prepareVendorProductInput(body as VendorProductInput),
      admin,
    );
    return Response.json({ product });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const admin = createAdminClient();
    if (!admin) throw new Error("Database is not configured.");
    const { data, error } = await admin
      .from("products")
      .select("id, vendor_id, name")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    // Admin can delete by id regardless of ownership (Kay or vendor).
    const { error: deleteError } = await admin
      .from("products")
      .delete()
      .eq("id", id);
    if (deleteError) {
      return Response.json(
        { error: deleteError.message || "Could not delete product." },
        { status: 400 },
      );
    }
    return Response.json({ ok: true, name: data.name });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
