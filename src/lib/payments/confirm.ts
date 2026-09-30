import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOrderById } from "@/lib/orders/repository";
import { notifyOrderEmails } from "@/lib/email/send";
import { notifyVendorsForPaidOrder } from "@/lib/email/vendor-orders";
import { getEmailSiteUrl } from "@/lib/site";
import { parseTxRef } from "@/lib/payments/config";
import type { PaymentKind } from "@/lib/payments/config";
import {
  getShareById,
  getShareOrderSummary,
  listSharesForOrder,
} from "@/lib/payments/shares";
import { sendNotice } from "@/lib/email/notice";
import { formatNaira } from "@/lib/data/home";

import { orderAccessPath } from "@/lib/orders/access";
import { notifyAdminsNewOrder } from "@/lib/orders/notify";
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

  if (kind === "table") {
    const { setTablePaymentPending } = await import("@/lib/table/payment");
    await setTablePaymentPending(id);
    return;
  }
  if (kind !== "concierge") return;

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
    .select("payment_status, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!existing) return false;
  if (existing.payment_status === "paid") return true;

  if (existing.status === "cancelled") {
    await sendNotice({
      type: "admin_alert",
      toTeam: true,
      subject: "Refund needed — payment on a cancelled order",
      title: "Payment received for a cancelled order",
      paragraphs: [
        `A payment (reference ${paymentReference}) arrived for order ${orderId} after it was cancelled. The order was not reopened — please refund it in Paystack.`,
      ],
      ctaUrl: `${getEmailSiteUrl()}/admin/jobs/gift/${orderId}`,
      ctaLabel: "Open order",
    });
    return true;
  }

  // Claim the transition atomically so webhook + return-page verify
  // can't both send the paid emails.
  const { data: claimed, error } = await db
    .from("orders")
    .update({
      payment_status: "paid",
      payment_reference: paymentReference,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select("id");
  if (error) throw new Error(error.message);
  if (!claimed?.length) return true;

  await db
    .from("vendor_order_items")
    .update({ fulfillment_status: "awaiting_hub_delivery" })
    .eq("order_id", orderId)
    .eq("fulfillment_status", "awaiting_payment");

  const order = await fetchOrderById(orderId);
  if (order) {
    await notifyOrderEmails(order, getEmailSiteUrl());
    await notifyAdminsNewOrder(order);
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
    .select(
      "payment_status, status, reference_number, product_name, contact_name, contact_email, payment_amount, selected_assignment_id, delivery_address, recipient_name, recipient_phone",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (!existing) return false;
  if (existing.payment_status === "paid") return true;

  const now = new Date().toISOString();
  const { data: claimed, error } = await db
    .from("concierge_requests")
    .update({
      payment_status: "paid",
      payment_reference: paymentReference,
      paid_at: now,
      status:
        existing.status === "vendor_selected" ? "in_fulfilment" : existing.status,
    })
    .eq("id", requestId)
    .neq("payment_status", "paid")
    .select("id");

  if (error) throw new Error(error.message);
  if (!claimed?.length) return true;

  const { assignDropoffHub } = await import("@/lib/fulfilment/hub-steps");
  await assignDropoffHub("concierge", requestId);

  await notifyConciergePaid(requestId, existing).catch((err) =>
    console.error("[concierge paid notify]", err),
  );
  return true;
}

async function notifyConciergePaid(
  requestId: string,
  row: {
    reference_number?: string | null;
    product_name?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    payment_amount?: number | null;
    selected_assignment_id?: string | null;
    delivery_address?: unknown;
    recipient_name?: string | null;
    recipient_phone?: string | null;
  },
) {
  const address = row.delivery_address as
    | { line1?: string; city?: string; state?: string }
    | null
    | undefined;
  const deliverTo = address
    ? `Deliver to ${row.recipient_name ?? row.contact_name ?? "the client"}${row.recipient_phone ? ` (${row.recipient_phone})` : ""}: ${[address.line1, address.city, address.state].filter(Boolean).join(", ")}.`
    : "";
  const site = getEmailSiteUrl();
  const ref = row.reference_number ?? requestId.slice(0, 8);
  const amount = row.payment_amount ? formatNaira(Number(row.payment_amount)) : "";

  const { data: assignment } = row.selected_assignment_id
    ? await admin()
        .from("concierge_vendor_assignments")
        .select("vendors(contact_email, contact_name, business_name)")
        .eq("id", row.selected_assignment_id)
        .maybeSingle()
    : { data: null };
  const vendor = (assignment?.vendors ?? null) as {
    contact_email?: string;
    contact_name?: string;
    business_name?: string;
  } | null;
  // dropoff_hub_* need migration 045; a missing column just means no hub line.
  const { data: hubRow } = await admin()
    .from("concierge_requests")
    .select("dropoff_hub_name, dropoff_hub_address")
    .eq("id", requestId)
    .maybeSingle();
  const hubName = (hubRow as { dropoff_hub_name?: string | null } | null)?.dropoff_hub_name;
  const hubAddress = (hubRow as { dropoff_hub_address?: string | null } | null)
    ?.dropoff_hub_address;

  await Promise.all([
    row.contact_email
      ? sendNotice({
          type: "concierge_update",
          to: [row.contact_email],
          subject: `Payment received — Kay Concierge ${ref}`,
          title: "Payment received",
          paragraphs: [
            `Hi ${row.contact_name || "there"},`,
            `We've received your payment${amount ? ` of ${amount}` : ""} for ${row.product_name ?? "your request"}. Your partner is preparing it and we'll email you when it's on its way.`,
          ],
          ctaUrl: `${site}/concierge/status/${requestId}`,
          ctaLabel: "View your request",
        })
      : Promise.resolve(),
    sendNotice({
      type: "concierge_update",
      toTeam: true,
      subject: `Concierge paid — ${ref}${amount ? ` (${amount})` : ""}`,
      title: "Concierge request paid",
      paragraphs: [
        `${row.contact_name ?? "A client"} paid for ${row.product_name ?? "their request"} (${ref}).`,
        vendor?.business_name ? `Partner: ${vendor.business_name}.` : "",
        deliverTo,
      ].filter(Boolean),
      ctaUrl: `${site}/admin/jobs/concierge/${requestId}`,
      ctaLabel: "Open the job",
    }),
    vendor?.contact_email
      ? sendNotice({
          type: "concierge_update",
          to: [vendor.contact_email],
          subject: `Go ahead — concierge ${ref} is paid`,
          title: "The client has paid",
          paragraphs: [
            `Hi ${vendor.contact_name || vendor.business_name || "there"},`,
            `${row.product_name ?? "The item"} (${ref}) is paid. Please prepare it and bring it to ${hubName ? `${hubName}${hubAddress ? ` (${hubAddress})` : ""}` : "the Kay hub shown in your vendor portal"}, then tap "I've sent it".`,
          ],
          ctaUrl: row.selected_assignment_id
            ? `${site}/vendor/jobs/concierge/${row.selected_assignment_id}`
            : `${site}/vendor`,
          ctaLabel: "Open the job",
        })
      : Promise.resolve(),
  ]);
}

/**
 * Mark one split share paid (idempotent). When every share is paid the
 * order itself is confirmed; late payments on a cancelled order are
 * flagged for refund.
 */
export async function confirmSharePayment(
  shareId: string,
  paymentReference: string,
): Promise<boolean> {
  const db = admin();
  const share = await getShareById(shareId);
  if (!share) return false;
  if (share.status === "paid" || share.status === "refund_due") return true;

  const summary = await getShareOrderSummary(share.orderId);
  if (!summary) return false;
  const orderCancelled =
    summary.status === "cancelled" || share.status === "void";

  const now = new Date().toISOString();
  const { data: claimed, error } = await db
    .from("order_payment_shares")
    .update({
      status: orderCancelled ? "refund_due" : "paid",
      payment_reference: paymentReference,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", shareId)
    .in("status", ["unpaid", "pending", "void"])
    .select("id");
  if (error) throw new Error(error.message);
  if (!claimed?.length) return true;

  const payer = share.payerName || share.payerEmail || `Person ${share.shareIndex}`;

  if (orderCancelled) {
    await sendNotice({
      type: "split_payment_update",
      toTeam: true,
      subject: `Refund needed — late split payment on order #${summary.orderNumber}`,
      title: "Late split payment",
      paragraphs: [
        `${payer} paid ${formatNaira(share.amount)} for order #${summary.orderNumber} after the split expired and the order was cancelled.`,
        `Paystack reference: ${paymentReference}. Please refund this payment manually.`,
      ],
    });
    return true;
  }

  const shares = await listSharesForOrder(share.orderId);
  const paidCount = shares.filter((s) => s.status === "paid").length;
  const allPaid = shares.length > 0 && paidCount === shares.length;

  if (allPaid) {
    await confirmOrderPayment(share.orderId, `split_${share.orderId}`);
  }

  if (summary.organiserEmail) {
    await sendNotice({
      type: "split_payment_update",
      to: [summary.organiserEmail],
      subject: allPaid
        ? `Everyone has paid — order #${summary.orderNumber} is confirmed`
        : `${payer} paid their share (${paidCount} of ${shares.length})`,
      title: allPaid ? "Your split is complete" : "A share was paid",
      paragraphs: allPaid
        ? [
            `All ${shares.length} shares for order #${summary.orderNumber} are paid. We're preparing your gift now.`,
          ]
        : [
            `${payer} just paid ${formatNaira(share.amount)} towards order #${summary.orderNumber}.`,
            `${paidCount} of ${shares.length} shares are paid. Nudge the others before the link expires.`,
          ],
      ctaUrl: `${getEmailSiteUrl()}${orderAccessPath(share.orderId, "/split")}`,
    });
  }

  return true;
}

export async function confirmPaymentFromTxRef(
  txRef: string,
  paymentReference: string,
  paidAmountNaira?: number,
): Promise<{ kind: PaymentKind; id: string } | null> {
  const parsed = parseTxRef(txRef);
  if (!parsed) return null;

  if (parsed.kind === "share") {
    if (paidAmountNaira !== undefined) {
      const share = await getShareById(parsed.id);
      if (!share || Math.abs(paidAmountNaira - share.amount) > 0.5) return null;
    }
    const ok = await confirmSharePayment(parsed.id, paymentReference);
    return ok ? parsed : null;
  }

  if (parsed.kind === "table") {
    const { confirmTablePayment } = await import("@/lib/table/payment");
    const ok = await confirmTablePayment(parsed.id, paymentReference, paidAmountNaira);
    return ok ? parsed : null;
  }

  if (parsed.kind === "order") {
    if (paidAmountNaira !== undefined) {
      const order = await loadOrderForPayment(parsed.id);
      if (!order || Math.abs(paidAmountNaira - order.grandTotal) > 0.5) {
        return null;
      }
    }
    const ok = await confirmOrderPayment(parsed.id, paymentReference);
    return ok ? parsed : null;
  }

  const ok = await confirmConciergePayment(parsed.id, paymentReference);
  if (paidAmountNaira !== undefined) {
    const { data: req } = await admin()
      .from("concierge_requests")
      .select("payment_amount")
      .eq("id", parsed.id)
      .maybeSingle();
    const expected = Number(req?.payment_amount ?? 0);
    if (!expected || Math.abs(paidAmountNaira - expected) > 0.5) return null;
  }
  return ok ? parsed : null;
}

export async function loadOrderForPayment(orderId: string) {
  const db = admin();
  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;

  const pricing = data.pricing as { grandTotal?: number } | null;
  return {
    id: data.id as string,
    orderNumber: data.order_number as string,
    paymentStatus: data.payment_status as string,
    paymentMode: (data.payment_mode as string | undefined) ?? "single",
    status: data.status as string,
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
