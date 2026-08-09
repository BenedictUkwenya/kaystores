import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  createMarkupTier,
  fetchMarkupTiersAdmin,
} from "@/lib/admin/pricing";

export async function GET() {
  try {
    await requireAdmin();
    const tiers = await fetchMarkupTiersAdmin();
    return Response.json({ tiers });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const tier = await createMarkupTier({
      minPrice: Number(body.minPrice ?? 0),
      maxPrice:
        body.maxPrice === null || body.maxPrice === "" || body.maxPrice === undefined
          ? null
          : Number(body.maxPrice),
      ratePercent: Number(body.ratePercent ?? 0),
      flatFee: Number(body.flatFee ?? 0),
      label: body.label != null ? String(body.label) : null,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : 0,
      active: body.active !== false,
    });
    return Response.json({ tier });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
