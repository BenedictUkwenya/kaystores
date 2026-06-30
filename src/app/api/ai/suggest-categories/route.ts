import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { suggestProductCategories } from "@/lib/ai/suggest-categories";

const rateMap = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function checkRateLimit(vendorId: string): boolean {
  const now = Date.now();
  const hits = (rateMap.get(vendorId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) return false;
  hits.push(now);
  rateMap.set(vendorId, hits);
  return true;
}

export async function POST(request: Request) {
  try {
    const { vendor } = await requireVendor();
    if (!checkRateLimit(vendor.id)) {
      return Response.json(
        { error: "Too many suggestions. Try again in a minute." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      brand?: string;
      price?: number;
      segment?: string;
    };

    const name = body.name?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    if (!name || !description) {
      return Response.json(
        { error: "Product name and description are required." },
        { status: 400 },
      );
    }

    const result = await suggestProductCategories({
      name,
      description,
      brand: body.brand?.trim(),
      price: body.price,
      segment: body.segment,
    });

    return Response.json(result);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
