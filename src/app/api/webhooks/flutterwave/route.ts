import { NextResponse } from "next/server";
import {
  extractWebhookTx,
  verifyFlutterwaveWebhookSignature,
} from "@/lib/payments/flutterwave";
import { confirmPaymentFromTxRef } from "@/lib/payments/confirm";
import { getFlutterwaveWebhookSecret } from "@/lib/payments/config";

export async function POST(request: Request) {
  const signature = request.headers.get("verif-hash");
  const secret = getFlutterwaveWebhookSecret();

  if (secret && !verifyFlutterwaveWebhookSignature(signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: Parameters<typeof extractWebhookTx>[0];
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const tx = extractWebhookTx(payload);
  if (!tx?.successful) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await confirmPaymentFromTxRef(tx.txRef, tx.reference);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/flutterwave]", err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}
