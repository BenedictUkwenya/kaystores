import { listAdminEmails } from "@/lib/email/admins";
import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";
import { sendNotice } from "@/lib/email/notice";
import { tableAccessPath } from "@/lib/orders/access";
import type { TableRequest, TableRequestStatus } from "@/types/table";

function tableSummary(request: TableRequest) {
  return {
    reference: request.reference,
    contactName: request.contactName,
    contactEmail: request.contactEmail,
    contactPhone: request.contactPhone ?? undefined,
    category: request.category,
    occasion: request.occasion ?? undefined,
    servings: request.servings ?? undefined,
    flavourNotes: request.flavourNotes ?? undefined,
    styleNotes: request.styleNotes ?? undefined,
    neededBy: request.neededBy ?? undefined,
    fulfillmentMethod: request.fulfillmentMethod,
    city: request.city ?? undefined,
    state: request.state ?? undefined,
    pickupHubName: request.pickupHubName ?? undefined,
    quoteAmount: request.quoteAmount ?? undefined,
    quoteNote: request.quoteNote ?? undefined,
    assignedVendorName: request.assignedVendorName ?? undefined,
    allergies: request.allergies ?? undefined,
    messageOnItem: request.messageOnItem ?? undefined,
    deliveryAddress: request.deliveryAddress ?? undefined,
    recipientName: request.recipientName ?? undefined,
    recipientPhone: request.recipientPhone ?? undefined,
    statusUrl: `${getEmailSiteUrl()}${tableAccessPath(request.id)}`,
  };
}

/** Bakers get the brief, never the client's contact details or private link. */
function vendorSafeSummary(request: TableRequest) {
  const {
    contactEmail: _e,
    contactPhone: _p,
    statusUrl: _s,
    deliveryAddress: _a,
    recipientName: _rn,
    recipientPhone: _rp,
    ...rest
  } = tableSummary(request);
  void [_e, _p, _s, _a, _rn, _rp];
  return {
    ...rest,
    contactName: request.contactName.trim().split(/\s+/)[0] || "Kay client",
    contactEmail: "",
  };
}

/** Client confirmation + alert every admin when a Kay Kitchen request is submitted. */
export async function notifyTableRequestSubmitted(request: TableRequest) {
  const adminEmails = await listAdminEmails();
  await sendKayEmail({
    type: "table_request",
    appUrl: getEmailSiteUrl(),
    adminEmails,
    request: tableSummary(request),
  });
}

/** Client: quote is ready after admin Save. */
export async function notifyTableQuoteReady(request: TableRequest) {
  await sendKayEmail({
    type: "table_quote_ready",
    appUrl: getEmailSiteUrl(),
    request: tableSummary(request),
  });
}

const STATUS_COPY: Partial<
  Record<TableRequestStatus, { subject: string; title: string; body: string }>
> = {
  reviewing: {
    subject: "is under review",
    title: "We're reviewing your request",
    body: "The Kay Kitchen team is reviewing your brief and matching it with the right baker. We'll be in touch shortly with a quote.",
  },
  quoted: {
    subject: "has a quote",
    title: "Your quote is ready",
    body: "We've prepared a quote for your request. Open your request page to accept and pay, or message us if you'd like changes.",
  },
  accepted: {
    subject: "has been accepted",
    title: "Your order is confirmed",
    body: "Great news — your Kay Kitchen request has been accepted and our baker is getting started. We'll keep you posted as it comes together.",
  },
  declined: {
    subject: "update",
    title: "An update on your request",
    body: "Unfortunately we can't take on this request right now. Reply to this email or message us on your request page and we'll help you find an alternative.",
  },
  fulfilled: {
    subject: "is complete",
    title: "Your treat has been delivered",
    body: "Your Kay Kitchen order is complete. We hope it made the moment special — thank you for choosing Kay.",
  },
};

/** Client: every admin status change (except back to submitted). */
export async function notifyTableStatusUpdate(request: TableRequest) {
  const copy = STATUS_COPY[request.status];
  if (!copy || !request.contactEmail) return;
  const extra =
    request.status === "quoted" && request.quoteAmount
      ? [`Quote: ₦${Math.round(request.quoteAmount).toLocaleString("en-NG")}${request.quoteNote ? ` — ${request.quoteNote}` : ""}`]
      : [];
  await sendNotice({
    type: "table_status_update",
    to: [request.contactEmail],
    subject: `Your Kay Kitchen request ${request.reference} ${copy.subject}`,
    title: copy.title,
    paragraphs: [`Hi ${request.contactName},`, copy.body, ...extra],
    ctaUrl: `${getEmailSiteUrl()}${tableAccessPath(request.id)}`,
    ctaLabel: "View your request",
  });
}

/** Assigned baker: new Kay Kitchen brief. */
export async function notifyTableVendorAssigned(
  vendor: {
    contactName: string;
    contactEmail: string;
    businessName: string;
  },
  request: TableRequest,
) {
  await sendKayEmail({
    type: "table_vendor_assigned",
    appUrl: getEmailSiteUrl(),
    vendor,
    request: vendorSafeSummary(request),
  });
}
