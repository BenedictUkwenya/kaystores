import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { getOrder } from "@/lib/orders/store";
import { fetchOrderById } from "@/lib/orders/repository";
import { notifyOrderEmails } from "@/lib/email/send";
import { notifyVendorsForPaidOrder } from "@/lib/email/vendor-orders";
import { getEmailSiteUrl } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

/** Customer attests offline payment when the gateway is not in use. */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const paidAt = new Date().toISOString();
  let updated = false;

  if (isAdminConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin
        .from("orders")
        .update({
          payment_status: "paid",
          payment_reference: "manual-confirm",
          paid_at: paidAt,
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await admin
        .from("vendor_order_items")
        .update({ fulfillment_status: "awaiting_hub_delivery" })
        .eq("order_id", id)
        .eq("fulfillment_status", "awaiting_payment");

      updated = true;
    }
  }

  if (!updated) {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_reference: "manual-confirm",
          paid_at: paidAt,
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch {
      return NextResponse.json(
        { error: "Could not update payment status." },
        { status: 500 },
      );
    }
  }

  const fresh = (await fetchOrderById(id)) ?? {
    ...order,
    paymentStatus: "paid" as const,
  };
  const appUrl = getEmailSiteUrl();
  await notifyOrderEmails(fresh, appUrl);
  await notifyVendorsForPaidOrder(id);

  return NextResponse.json({ ok: true });
}
