import { NextResponse } from "next/server";
import {
  extractPaystackWebhookTx,
  verifyPaystackWebhookSignature,
} from "@/lib/payments/paystack";
import { confirmPaymentFromTxRef } from "@/lib/payments/confirm";
import { isPaystackConfigured } from "@/lib/payments/config";

export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Paystack not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: Parameters<typeof extractPaystackWebhookTx>[0];
  try {
    payload = JSON.parse(rawBody) as Parameters<typeof extractPaystackWebhookTx>[0];
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const tx = extractPaystackWebhookTx(payload);
  if (!tx?.successful) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await confirmPaymentFromTxRef(tx.txRef, tx.reference);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/paystack]", err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}
