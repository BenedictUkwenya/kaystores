import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/roles";
import { calculateConciergeClientPrice } from "@/lib/pricing/concierge";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  initializePaystackPayment,
  isPaystackChargeSuccessful,
  koboToNaira,
  verifyPaystackByReference,
} from "@/lib/payments/paystack";
import {
  confirmPaymentFromTxRef,
  loadConciergeForPayment,
  loadOrderForPayment,
  setPaymentPending,
} from "@/lib/payments/confirm";
import {
  getShareByToken,
  getShareOrderSummary,
  isSplitExpired,
  markSharePending,
} from "@/lib/payments/shares";

export async function POST(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json(
        {
          error:
            "Paystack is not configured yet. Add PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();

    if (body.kind === "share") {
      return initializeSharePayment(body);
    }

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

      if (order.paymentMode === "split") {
        return NextResponse.json(
          { error: "This order is being split — pay using your share link." },
          { status: 400 },
        );
      }

      if (order.status === "cancelled") {
        return NextResponse.json({ error: "This order was cancelled." }, { status: 400 });
      }

      if (order.grandTotal < 1) {
        return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
      }

      const email = user?.email ?? emailOverride ?? order.buyer.email;

      await setPaymentPending("order", id, order.grandTotal);

      const payment = await initializePaystackPayment({
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

    const payment = await initializePaystackPayment({
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function initializeSharePayment(body: {
  token?: unknown;
  name?: unknown;
  email?: unknown;
}) {
  const token = String(body.token ?? "");
  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!name) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const share = await getShareByToken(token);
  if (!share) {
    return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  }
  if (share.status === "paid") {
    return NextResponse.json({ error: "This share is already paid." }, { status: 400 });
  }
  if (share.status !== "unpaid" && share.status !== "pending") {
    return NextResponse.json({ error: "This share is no longer open." }, { status: 400 });
  }

  const summary = await getShareOrderSummary(share.orderId);
  if (!summary || summary.status === "cancelled") {
    return NextResponse.json({ error: "This order was cancelled." }, { status: 400 });
  }
  if (summary.paymentStatus === "paid") {
    return NextResponse.json({ error: "This order is already fully paid." }, { status: 400 });
  }
  if (isSplitExpired(summary)) {
    return NextResponse.json({ error: "This split link has expired." }, { status: 400 });
  }

  await markSharePending(share.id, { name, email });

  const payment = await initializePaystackPayment({
    kind: "share",
    id: share.id,
    amount: share.amount,
    email,
    name,
    title: "Kay Stores",
    description: `Share ${share.shareIndex} of order ${summary.orderNumber}`,
    redirectPath: `/split/${share.token}?payment=return`,
  });

  return NextResponse.json(payment);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const reference =
      url.searchParams.get("reference") ?? url.searchParams.get("tx_ref");
    if (!reference) {
      return NextResponse.json({ error: "reference required." }, { status: 400 });
    }

    if (!isPaystackConfigured()) {
      return NextResponse.json({ configured: false, paid: false });
    }

    const verified = await verifyPaystackByReference(reference);
    if (!verified || !isPaystackChargeSuccessful(verified)) {
      return NextResponse.json({
        paid: false,
        status: verified?.status ?? "unknown",
      });
    }

    const kind = verified.metadata?.kind;
    const confirmed = await confirmPaymentFromTxRef(
      reference,
      String(verified.id ?? reference),
      kind === "order" || kind === "share"
        ? koboToNaira(verified.amount)
        : undefined,
    );
    if (!confirmed && (kind === "order" || kind === "share")) {
      return NextResponse.json(
        { paid: false, error: "Amount mismatch." },
        { status: 400 },
      );
    }

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
