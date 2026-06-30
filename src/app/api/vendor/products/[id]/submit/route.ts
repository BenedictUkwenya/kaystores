import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { publishVendorProduct } from "@/lib/vendors/repository";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { vendor } = await requireVendor();
    const { id } = await params;
    await publishVendorProduct(id, vendor.id);
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
