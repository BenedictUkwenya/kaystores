import { NextResponse } from "next/server";
import { fetchOrderById } from "@/lib/orders/repository";
import {
  getRevealByToken,
  markRevealOpened,
} from "@/lib/reveal/repository";
import { signRevealMedia } from "@/lib/storage/gift-reveal-media";
import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const reveal = await getRevealByToken(token);
    if (!reveal) {
      return NextResponse.json({ error: "Reveal not found." }, { status: 404 });
    }

    const order = await fetchOrderById(reveal.orderId);
    if (!order || order.deliveryType !== "gift") {
      return NextResponse.json({ error: "Reveal not found." }, { status: 404 });
    }

    const wasUnopened = !reveal.openedAt;
    const opened = await markRevealOpened(token);

    if (wasUnopened && !reveal.openedAt) {
      void sendKayEmail({
        type: "gift_reveal_opened",
        appUrl: getEmailSiteUrl(),
        to: order.buyer.email,
        buyerName: order.buyer.fullName,
        recipientName: order.gift?.recipientName ?? "your recipient",
        orderNumber: order.orderNumber,
        orderId: order.id,
      }).catch((err) => console.error("[reveal] opened email:", err));
    }

    const [videoUrl, photoUrl] = await Promise.all([
      signRevealMedia(opened.videoPath, 7200),
      signRevealMedia(opened.photoPath, 7200),
    ]);

    const hasContent = Boolean(
      opened.note?.trim() || opened.videoPath || opened.photoPath,
    );

    return NextResponse.json({
      reveal: {
        note: opened.note,
        hasVideo: Boolean(opened.videoPath),
        hasPhoto: Boolean(opened.photoPath),
        hasContent,
        videoUrl,
        photoUrl,
        openedAt: opened.openedAt,
      },
      senderName: order.gift?.anonymous ? null : order.buyer.fullName,
      anonymous: Boolean(order.gift?.anonymous),
      recipientName: order.gift?.recipientName ?? null,
    });
  } catch (err) {
    console.error("[reveal] public GET", err);
    return NextResponse.json({ error: "Could not load reveal." }, { status: 500 });
  }
}
