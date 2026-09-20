import { listAdminEmails } from "@/lib/email/admins";
import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";
import type { TableRequest } from "@/types/table";

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
    statusUrl: `${getEmailSiteUrl()}/table/request/${request.id}`,
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
    request: tableSummary(request),
  });
}
