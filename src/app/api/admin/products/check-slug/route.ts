import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { checkProductSlugAvailability } from "@/lib/products/slug-availability";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") ?? "";
    const excludeProductId = searchParams.get("excludeProductId") ?? undefined;
    const result = await checkProductSlugAvailability(slug, excludeProductId);
    return Response.json(result);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
