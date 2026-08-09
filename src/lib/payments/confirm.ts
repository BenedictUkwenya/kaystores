import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderAdmin } from "@/lib/admin/repository";
import { fetchOrderById } from "@/lib/orders/repository";
import { notifyOrderEmails } from "@/lib/email/send";
import { notifyVendorsForPaidOrder } from "@/lib/email/vendor-orders";
import { getEmailSiteUrl } from "@/lib/site";
import { parseTxRef } from "@/lib/payments/config";
import type { PaymentKind } from "@/lib/payments/config";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("Admin client not configured");
  return client;
}

export async function setPaymentPending(
  kind: PaymentKind,
  id: string,
  amount: number,
): Promise<void> {
  const db = admin();

  if (kind === "order") {
    const { error } = await db
      .from("orders")
      .update({ payment_status: "pending" })
      .eq("id", id)
      .eq("payment_status", "unpaid");
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await db
    .from("concierge_requests")
    .update({
      payment_status: "pending",
      payment_amount: amount,
    })
    .eq("id", id)
    .in("payment_status", ["unpaid", "pending"]);

  if (error) throw new Error(error.message);
}

export async function confirmOrderPayment(
  orderId: string,
  paymentReference: string,
): Promise<boolean> {
  const db = admin();

  const { data: existing } = await db
    .from("orders")
    .select("payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!existing) return false;
  if (existing.payment_status === "paid") return true;

  await updateOrderAdmin(orderId, {
    paymentStatus: "paid",
    paymentReference,
  });

  const order = await fetchOrderById(orderId);
  if (order) {
    await notifyOrderEmails(order, getEmailSiteUrl());
    await notifyVendorsForPaidOrder(orderId);
  }

  return true;
}

export async function confirmConciergePayment(
  requestId: string,
  paymentReference: string,
): Promise<boolean> {
  const db = admin();

  const { data: existing } = await db
    .from("concierge_requests")
    .select("payment_status, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!existing) return false;
  if (existing.payment_status === "paid") return true;

  const now = new Date().toISOString();
  const { error } = await db
    .from("concierge_requests")
    .update({
      payment_status: "paid",
      payment_reference: paymentReference,
      paid_at: now,
      status:
        existing.status === "vendor_selected" ? "in_fulfilment" : existing.status,
    })
    .eq("id", requestId);

  if (error) throw new Error(error.message);
  return true;
}

export async function confirmPaymentFromTxRef(
  txRef: string,
  paymentReference: string,
): Promise<{ kind: PaymentKind; id: string } | null> {
  const parsed = parseTxRef(txRef);
  if (!parsed) return null;

  if (parsed.kind === "order") {
    const ok = await confirmOrderPayment(parsed.id, paymentReference);
    return ok ? parsed : null;
  }

  const ok = await confirmConciergePayment(parsed.id, paymentReference);
  return ok ? parsed : null;
}

export async function loadOrderForPayment(orderId: string) {
  const db = admin();
  const { data, error } = await db
    .from("orders")
    .select("id, order_number, payment_status, pricing, buyer")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;

  const pricing = data.pricing as { grandTotal?: number } | null;
  return {
    id: data.id as string,
    orderNumber: data.order_number as string,
    paymentStatus: data.payment_status as string,
    grandTotal: pricing?.grandTotal ?? 0,
    buyer: data.buyer as {
      fullName: string;
      email: string;
      phone: string;
    },
  };
}

export async function loadConciergeForPayment(requestId: string) {
  const db = admin();
  const { data: request, error } = await db
    .from("concierge_requests")
    .select(
      `
      id,
      reference_number,
      product_name,
      payment_status,
      selected_assignment_id,
      contact_name,
      contact_email,
      contact_phone
    `,
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request || !request.selected_assignment_id) return null;

  const { data: assignment } = await db
    .from("concierge_vendor_assignments")
    .select("quoted_price")
    .eq("id", request.selected_assignment_id)
    .maybeSingle();

  const quotedPrice = assignment?.quoted_price ?? 0;
  if (quotedPrice < 1) return null;

  return {
    id: request.id as string,
    referenceNumber: request.reference_number as string,
    productName: request.product_name as string,
    paymentStatus: request.payment_status as string,
    quotedPrice,
    contactName: request.contact_name as string,
    contactEmail: request.contact_email as string,
    contactPhone: request.contact_phone as string,
  };
}
