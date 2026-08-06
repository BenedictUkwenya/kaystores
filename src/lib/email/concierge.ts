import { getEmailSiteUrl } from "@/lib/site";
import type { ConciergeRequest } from "@/types/concierge";

export async function notifyConciergeAssigned(
  vendor: {
    contactName: string;
    contactEmail: string;
    businessName: string;
  },
  request: ConciergeRequest,
) {
  await sendKayEmail({
    type: "vendor_concierge_assigned",
    appUrl: getEmailSiteUrl(),
    vendor,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      brand: request.brand,
      budget: request.budget,
      description: request.description,
    },
  });
}

export async function notifyConciergeRecommendationReady(request: ConciergeRequest) {
  const siteUrl = getEmailSiteUrl();
  await sendKayEmail({
    type: "concierge_recommendation_ready",
    appUrl: siteUrl,
    recipientEmail: request.contactEmail,
    recipientName: request.contactName,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      statusUrl: `${siteUrl}/concierge/status/${request.id}`,
    },
  });
}

export async function notifyConciergeOffersReady(request: ConciergeRequest) {
  const siteUrl = getEmailSiteUrl();
  await sendKayEmail({
    type: "concierge_offers_ready",
    appUrl: siteUrl,
    recipientEmail: request.contactEmail,
    recipientName: request.contactName,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      statusUrl: `${siteUrl}/concierge/status/${request.id}`,
    },
  });
}

export async function notifyConciergeOfferSelectedClient(
  request: ConciergeRequest,
  offer: { vendorBusinessName: string; quotedPrice: number },
) {
  const siteUrl = getEmailSiteUrl();
  await sendKayEmail({
    type: "concierge_offer_selected_client",
    appUrl: siteUrl,
    recipientEmail: request.contactEmail,
    recipientName: request.contactName,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      vendorBusinessName: offer.vendorBusinessName,
      quotedPrice: offer.quotedPrice,
      statusUrl: `${siteUrl}/concierge/status/${request.id}`,
    },
  });
}

export async function notifyConciergeOfferWon(
  vendor: {
    contactName: string;
    contactEmail: string;
    businessName: string;
  },
  request: ConciergeRequest,
) {
  await sendKayEmail({
    type: "concierge_offer_won",
    appUrl: getEmailSiteUrl(),
    vendor,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
    },
  });
}

export async function notifyConciergeOfferLost(
  vendor: {
    contactName: string;
    contactEmail: string;
    businessName: string;
  },
  request: ConciergeRequest,
) {
  await sendKayEmail({
    type: "concierge_offer_lost",
    appUrl: getEmailSiteUrl(),
    vendor,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
    },
  });
}

export async function notifyConciergeAdminAlert(
  request: ConciergeRequest,
  alertTitle: string,
  alertDetail?: string,
) {
  await sendKayEmail({
    type: "concierge_admin_alert",
    appUrl: getEmailSiteUrl(),
    alertTitle,
    alertDetail,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      brand: request.brand,
      budget: request.budget,
      description: request.description,
    },
  });
}
