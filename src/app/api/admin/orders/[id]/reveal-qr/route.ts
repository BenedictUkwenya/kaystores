import { requireAdmin, apiErrorResponse } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
import {
  ensureGiftReveal,
  getRevealByOrderId,
  lockGiftReveal,
} from "@/lib/reveal/repository";
import {
  generateRevealQrPng,
  generateRevealStickerPdf,
} from "@/lib/reveal/qr";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await fetchOrderById(id);
    if (!order || order.deliveryType !== "gift") {
      return Response.json({ error: "Gift order not found." }, { status: 404 });
    }

    const reveal =
      (await getRevealByOrderId(order.id)) ?? (await ensureGiftReveal(order));
    if (!reveal) {
      return Response.json({ error: "Reveal unavailable." }, { status: 500 });
    }

    // Printing the packing sticker locks further sender edits.
    await lockGiftReveal(order.id);

    const format = new URL(request.url).searchParams.get("format") ?? "pdf";

    if (format === "png") {
      const png = await generateRevealQrPng(reveal.token, 720);
      return new Response(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="kay-reveal-${order.orderNumber}.png"`,
        },
      });
    }

    const pdf = await generateRevealStickerPdf({
      token: reveal.token,
      orderNumber: order.orderNumber,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kay-reveal-${order.orderNumber}.pdf"`,
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
