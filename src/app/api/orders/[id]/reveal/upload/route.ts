import { NextResponse } from "next/server";
import { loadOrderForBuyer } from "@/lib/reveal/auth";
import {
  ensureGiftReveal,
  getRevealByOrderId,
  isRevealEditable,
} from "@/lib/reveal/repository";
import {
  assertRevealMediaFile,
  createRevealUploadUrl,
} from "@/lib/storage/gift-reveal-media";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      buyerEmail?: string;
      kind?: "video" | "photo";
      fileName?: string;
      contentType?: string;
      size?: number;
    };

    if (body.kind !== "video" && body.kind !== "photo") {
      return NextResponse.json({ error: "kind must be video or photo." }, { status: 400 });
    }
    if (!body.fileName) {
      return NextResponse.json({ error: "fileName is required." }, { status: 400 });
    }

    // Validate size/type via a stub File-like check
    const stub = {
      name: body.fileName,
      size: body.size ?? 1,
      type: body.contentType ?? "",
    } as File;
    assertRevealMediaFile(stub, body.kind);

    const order = await loadOrderForBuyer(id, body.buyerEmail);
    if (!order || order.deliveryType !== "gift") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const reveal =
      (await getRevealByOrderId(order.id)) ?? (await ensureGiftReveal(order));
    if (!reveal || !isRevealEditable(order, reveal)) {
      return NextResponse.json(
        { error: "This Reveal can no longer be edited." },
        { status: 403 },
      );
    }

    const upload = await createRevealUploadUrl(
      order.id,
      body.kind,
      body.fileName,
      body.contentType,
    );

    return NextResponse.json(upload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload prep failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
