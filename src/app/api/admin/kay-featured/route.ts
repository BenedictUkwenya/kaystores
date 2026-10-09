import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { createFeaturedSlot, listFeaturedSlots } from "@/lib/ai/featured";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ slots: await listFeaturedSlots() });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      productId?: string;
      amountNgn?: number;
      startsAt?: string;
      endsAt?: string;
      note?: string;
    };
    const productId = String(body.productId ?? "").trim();
    const amountNgn = Number(body.amountNgn);
    const startsAt = String(body.startsAt ?? "").trim();
    const endsAt = String(body.endsAt ?? "").trim();
    if (!productId || !startsAt || !endsAt || !Number.isFinite(amountNgn) || amountNgn < 0) {
      return Response.json({ error: "Product, amount, and dates are required." }, { status: 400 });
    }
    if (endsAt < startsAt) {
      return Response.json({ error: "The end date has to be on or after the start date." }, { status: 400 });
    }
    const result = await createFeaturedSlot({
      productId,
      amountNgn: Math.round(amountNgn),
      startsAt,
      endsAt,
      note: body.note,
    });
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    return Response.json(result);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
