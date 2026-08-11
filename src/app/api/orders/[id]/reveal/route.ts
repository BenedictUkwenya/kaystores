import { NextResponse } from "next/server";
import {
  ensureGiftReveal,
  getRevealByOrderId,
  isRevealEditable,
  updateGiftReveal,
} from "@/lib/reveal/repository";
import { loadOrderForBuyer } from "@/lib/reveal/auth";
import { generateRevealQrDataUrl, revealUrl } from "@/lib/reveal/qr";
import { signRevealMedia } from "@/lib/storage/gift-reveal-media";
import { GIFT_REVEAL_NOTE_MAX } from "@/types/reveal";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const buyerEmail = new URL(request.url).searchParams.get("email");
    const order = await loadOrderForBuyer(id, buyerEmail);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.deliveryType !== "gift") {
      return NextResponse.json(
        { error: "Kay Reveal is only available on gift orders." },
        { status: 400 },
      );
    }

    const reveal =
      (await getRevealByOrderId(order.id)) ?? (await ensureGiftReveal(order));
    if (!reveal) {
      return NextResponse.json({ error: "Reveal unavailable." }, { status: 500 });
    }

    const editable = isRevealEditable(order, reveal);
    const [videoUrl, photoUrl, qrDataUrl] = await Promise.all([
      signRevealMedia(reveal.videoPath),
      signRevealMedia(reveal.photoPath),
      generateRevealQrDataUrl(reveal.token),
    ]);

    return NextResponse.json({
      reveal: {
        token: reveal.token,
        note: reveal.note,
        hasVideo: Boolean(reveal.videoPath),
        hasPhoto: Boolean(reveal.photoPath),
        openedAt: reveal.openedAt,
        lockedAt: reveal.lockedAt,
        editable,
        url: revealUrl(reveal.token),
        videoUrl,
        photoUrl,
        qrDataUrl,
      },
      recipientName: order.gift?.recipientName ?? null,
      anonymous: order.gift?.anonymous ?? false,
    });
  } catch (err) {
    console.error("[reveal] GET", err);
    return NextResponse.json({ error: "Could not load reveal." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const json = (await request.json()) as {
      buyerEmail?: string;
      note?: string | null;
      clearVideo?: boolean;
      clearPhoto?: boolean;
      videoPath?: string | null;
      photoPath?: string | null;
    };

    const order = await loadOrderForBuyer(id, json.buyerEmail);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.deliveryType !== "gift") {
      return NextResponse.json(
        { error: "Kay Reveal is only available on gift orders." },
        { status: 400 },
      );
    }

    const reveal =
      (await getRevealByOrderId(order.id)) ?? (await ensureGiftReveal(order));
    if (!reveal) {
      return NextResponse.json({ error: "Reveal unavailable." }, { status: 500 });
    }
    if (!isRevealEditable(order, reveal)) {
      return NextResponse.json(
        { error: "This Reveal can no longer be edited." },
        { status: 403 },
      );
    }

    if (
      json.note !== undefined &&
      json.note != null &&
      json.note.length > GIFT_REVEAL_NOTE_MAX
    ) {
      return NextResponse.json(
        { error: `Note must be ${GIFT_REVEAL_NOTE_MAX} characters or fewer.` },
        { status: 400 },
      );
    }

    // Paths must belong to this order prefix
    if (
      json.videoPath &&
      !String(json.videoPath).startsWith(`${order.id}/`)
    ) {
      return NextResponse.json({ error: "Invalid video path." }, { status: 400 });
    }
    if (
      json.photoPath &&
      !String(json.photoPath).startsWith(`${order.id}/`)
    ) {
      return NextResponse.json({ error: "Invalid photo path." }, { status: 400 });
    }

    const updated = await updateGiftReveal(order.id, {
      note: json.note,
      videoPath: json.videoPath ?? undefined,
      photoPath: json.photoPath ?? undefined,
      clearVideo: Boolean(json.clearVideo) && !json.videoPath,
      clearPhoto: Boolean(json.clearPhoto) && !json.photoPath,
    });

    const [videoUrl, photoUrl, qrDataUrl] = await Promise.all([
      signRevealMedia(updated.videoPath),
      signRevealMedia(updated.photoPath),
      generateRevealQrDataUrl(updated.token),
    ]);

    return NextResponse.json({
      reveal: {
        token: updated.token,
        note: updated.note,
        hasVideo: Boolean(updated.videoPath),
        hasPhoto: Boolean(updated.photoPath),
        openedAt: updated.openedAt,
        lockedAt: updated.lockedAt,
        editable: true,
        url: revealUrl(updated.token),
        videoUrl,
        photoUrl,
        qrDataUrl,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update reveal.";
    console.error("[reveal] POST", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
