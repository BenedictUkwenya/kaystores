import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrder } from "@/lib/orders/store";
import { isPaystackConfigured } from "@/lib/payments/config";
import { notifyManualPaymentClaim } from "@/lib/orders/notify";
import { isUuid } from "@/lib/orders/resolve";
import { resolveOrderViewer } from "@/lib/orders/access";

type Params = { params: Promise<{ id: string }> };

/**
 * Customer says they paid offline (only when Paystack is off). This never
 * marks the order paid — it flags it for an admin to verify the transfer.
 */
export async function POST(_request: Request, { params }: Params) {
  if (isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Please pay online with Paystack." },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const order = await getOrder(id);
  if (!order || !(await resolveOrderViewer(order))) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "This order was cancelled." }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: "Payments are unavailable." }, { status: 503 });
  }
  const { data: claimed, error } = await db
    .from("orders")
    .update({ payment_status: "pending", payment_reference: "manual-claim" })
    .eq("id", id)
    .eq("payment_status", "unpaid")
    .select("id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (claimed?.length) await notifyManualPaymentClaim(order);

  return NextResponse.json({ ok: true, pendingVerification: true });
}
