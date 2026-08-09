import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/roles";
import { calculateConciergeClientPrice } from "@/lib/pricing/concierge";
import {
  isFlutterwaveConfigured,
} from "@/lib/payments/config";
import {
  initializeFlutterwavePayment,
  verifyFlutterwaveByTxRef,
  isFlutterwaveChargeSuccessful,
} from "@/lib/payments/flutterwave";
import {
  confirmPaymentFromTxRef,
  loadConciergeForPayment,
  loadOrderForPayment,
  setPaymentPending,
} from "@/lib/payments/confirm";

export async function POST(request: Request) {
  try {
    if (!isFlutterwaveConfigured()) {
      return NextResponse.json(
        {
          error:
            "Flutterwave is not configured yet. Add FLUTTERWAVE_SECRET_KEY and NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const kind = body.kind === "concierge" ? "concierge" : "order";
    const id = String(body.id ?? "");
    const emailOverride = body.email ? String(body.email) : undefined;

    if (!id) {
      return NextResponse.json({ error: "Payment target is required." }, { status: 400 });
    }

    const user = await getSessionUser();

    if (kind === "order") {
      const order = await loadOrderForPayment(id);
      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      if (order.paymentStatus === "paid") {
        return NextResponse.json({ error: "Order is already paid." }, { status: 400 });
      }

      const email = user?.email ?? emailOverride ?? order.buyer.email;

      await setPaymentPending("order", id, order.grandTotal);

      const payment = await initializeFlutterwavePayment({
        kind: "order",
        id,
        amount: order.grandTotal,
        email,
        name: order.buyer.fullName,
        phone: order.buyer.phone,
        title: "Kay Stores",
        description: `Order ${order.orderNumber}`,
        redirectPath: `/order/${id}?payment=return`,
      });

      return NextResponse.json(payment);
    }

    const concierge = await loadConciergeForPayment(id);
    if (!concierge) {
      return NextResponse.json(
        { error: "Concierge request not ready for payment." },
        { status: 404 },
      );
    }

    if (concierge.paymentStatus === "paid") {
      return NextResponse.json({ error: "Already paid." }, { status: 400 });
    }

    const normalizedEmail = (user?.email ?? emailOverride ?? concierge.contactEmail)
      .trim()
      .toLowerCase();

    const breakdown = await calculateConciergeClientPrice(concierge.quotedPrice);
    await setPaymentPending("concierge", id, breakdown.clientPrice);

    const payment = await initializeFlutterwavePayment({
      kind: "concierge",
      id,
      amount: breakdown.clientPrice,
      email: normalizedEmail,
      name: concierge.contactName,
      phone: concierge.contactPhone,
      title: "Kay Concierge",
      description: `${concierge.productName} (${concierge.referenceNumber})`,
      redirectPath: `/concierge/status/${id}?payment=return`,
    });

    return NextResponse.json({ ...payment, breakdown });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment init failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const txRef = new URL(request.url).searchParams.get("tx_ref");
    if (!txRef) {
      return NextResponse.json({ error: "tx_ref required." }, { status: 400 });
    }

    if (!isFlutterwaveConfigured()) {
      return NextResponse.json({ configured: false, paid: false });
    }

    const verified = await verifyFlutterwaveByTxRef(txRef);
    if (!verified || !isFlutterwaveChargeSuccessful(verified)) {
      return NextResponse.json({ paid: false, status: verified?.status ?? "unknown" });
    }

    const confirmed = await confirmPaymentFromTxRef(
      txRef,
      verified.flw_ref ?? String(verified.id ?? txRef),
    );

    return NextResponse.json({
      paid: Boolean(confirmed),
      kind: confirmed?.kind,
      id: confirmed?.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
