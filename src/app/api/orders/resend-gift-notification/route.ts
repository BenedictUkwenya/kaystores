import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders/store";
import { resendGiftRecipientEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      buyerEmail?: string;
    };

    const orderId = body.orderId?.trim();
    const buyerEmail = body.buyerEmail?.trim().toLowerCase();

    if (!orderId || !buyerEmail) {
      return NextResponse.json(
        { error: "Order ID and buyer email are required." },
        { status: 400 },
      );
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.buyer.email.trim().toLowerCase() !== buyerEmail) {
      return NextResponse.json({ error: "Email does not match order." }, { status: 403 });
    }

    if (order.deliveryType !== "gift" || !order.gift?.recipientEmail) {
      return NextResponse.json(
        { error: "This order has no gift recipient email." },
        { status: 400 },
      );
    }

    const result = await resendGiftRecipientEmail(order, getSiteUrl());
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Could not resend notification." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      recipientEmail: order.gift.recipientEmail,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not resend gift notification." },
      { status: 500 },
    );
  }
}
