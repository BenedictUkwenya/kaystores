import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotice } from "@/lib/email/notice";
import { getEmailSiteUrl } from "@/lib/site";
import { formatNaira } from "@/lib/data/home";
import { tableAccessPath } from "@/lib/orders/access";
import { getTableRequestById } from "@/lib/table/repository";
import { assignDropoffHub } from "@/lib/fulfilment/hub-steps";
import type { TableRequest } from "@/types/table";

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

/** Why a request can't be paid right now, or null when it can. */
export function tablePaymentBlocker(request: TableRequest): string | null {
  if (request.paymentStatus === "paid") return "This request is already paid.";
  if (request.status !== "quoted") return "This request doesn't have an open quote.";
  if (!request.quoteAmount || request.quoteAmount < 1) return "The quote isn't ready yet.";
  return null;
}

export async function setTablePaymentPending(requestId: string) {
  const { error } = await db()
    .from("table_requests")
    .update({ payment_status: "pending" })
    .eq("id", requestId)
    .in("payment_status", ["unpaid", "pending"]);
  if (error) throw new Error(error.message);
}

/**
 * Mark a Kay Kitchen quote paid (idempotent) and move it to "accepted".
 * `expectedAmount` guards against paying an old quote after it changed.
 */
export async function confirmTablePayment(
  requestId: string,
  paymentReference: string,
  paidAmount?: number,
): Promise<boolean> {
  const request = await getTableRequestById(requestId);
  if (!request) return false;
  if (request.paymentStatus === "paid") return true;
  if (
    paidAmount !== undefined &&
    Math.abs(paidAmount - Number(request.quoteAmount ?? 0)) > 0.5
  ) {
    return false;
  }

  const lateOrClosed = request.status === "declined" || request.status === "fulfilled";
  const now = new Date().toISOString();
  const { data: claimed, error } = await db()
    .from("table_requests")
    .update({
      payment_status: "paid",
      payment_reference: paymentReference,
      paid_at: now,
      updated_at: now,
      ...(lateOrClosed ? {} : { status: "accepted" }),
    })
    .eq("id", requestId)
    .neq("payment_status", "paid")
    .select("id");
  if (error) throw new Error(error.message);
  if (!claimed?.length) return true;

  const site = getEmailSiteUrl();
  const amount = formatNaira(Number(request.quoteAmount ?? paidAmount ?? 0));

  if (lateOrClosed) {
    await sendNotice({
      type: "admin_alert",
      toTeam: true,
      subject: `Refund needed — payment on closed Kay Kitchen request ${request.reference}`,
      title: "Payment on a closed request",
      paragraphs: [
        `${request.contactName} paid ${amount} (ref ${paymentReference}) for ${request.reference}, which is ${request.status}. Refund it or reopen the request.`,
      ],
      ctaUrl: `${site}/admin/jobs/kitchen/${request.id}`,
      ctaLabel: "Open the job",
    });
    return true;
  }

  await assignDropoffHub("kitchen", requestId);
  const withHub = (await getTableRequestById(requestId).catch(() => null)) ?? request;

  await Promise.all([
    sendNotice({
      type: "kitchen_update",
      to: [request.contactEmail],
      subject: `Payment received — Kay Kitchen ${request.reference}`,
      title: "You're all set",
      paragraphs: [
        `Hi ${request.contactName},`,
        `We've received your payment of ${amount}. Your baker is getting started and we'll keep you posted here and by email.`,
      ],
      ctaUrl: `${site}${tableAccessPath(request.id)}`,
      ctaLabel: "View your request",
    }).catch(() => undefined),
    sendNotice({
      type: "kitchen_update",
      toTeam: true,
      subject: `Kay Kitchen paid — ${request.reference} (${amount})`,
      title: "Kitchen quote paid",
      paragraphs: [
        `${request.contactName} paid ${amount} for ${request.reference}.`,
        request.assignedVendorName
          ? `Baker: ${request.assignedVendorName}. They've been told to start.`
          : "No baker assigned yet — assign one now.",
        request.neededBy ? `Needed by ${request.neededBy}.` : "",
      ].filter(Boolean),
      ctaUrl: `${site}/admin/jobs/kitchen/${request.id}`,
      ctaLabel: "Open the job",
    }).catch(() => undefined),
    notifyBakerPaid(withHub).catch(() => undefined),
  ]);

  return true;
}

async function notifyBakerPaid(request: TableRequest) {
  if (!request.assignedVendorId) return;
  const { data: vendor } = await db()
    .from("vendors")
    .select("contact_email, contact_name")
    .eq("id", request.assignedVendorId)
    .maybeSingle();
  if (!vendor?.contact_email) return;
  await sendNotice({
    type: "kitchen_update",
    to: [String(vendor.contact_email)],
    subject: `Go ahead — Kay Kitchen ${request.reference} is paid`,
    title: "The client has paid",
    paragraphs: [
      `Hi ${vendor.contact_name || "there"},`,
      `${request.reference} is confirmed and paid. Please start${request.neededBy ? ` — it's needed by ${request.neededBy}` : ""}.`,
      request.dropoffHubName
        ? `When it's ready, bring it to ${request.dropoffHubName}${request.dropoffHubAddress ? ` (${request.dropoffHubAddress})` : ""} and tap "I've sent it" in your portal.`
        : "When it's ready, bring it to the Kay hub shown in your portal and tap \"I've sent it\".",
    ],
    ctaUrl: `${getEmailSiteUrl()}/vendor/jobs/kitchen/${request.id}`,
    ctaLabel: "Open the job",
  });
}
