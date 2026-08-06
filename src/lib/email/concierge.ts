import { sendKayEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site";
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
    appUrl: getSiteUrl(),
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
  await sendKayEmail({
    type: "concierge_recommendation_ready",
    appUrl: getSiteUrl(),
    recipientEmail: request.contactEmail,
    recipientName: request.contactName,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      statusUrl: `${getSiteUrl()}/concierge/status/${request.id}`,
    },
  });
}

export async function notifyConciergeOffersReady(request: ConciergeRequest) {
  await sendKayEmail({
    type: "concierge_offers_ready",
    appUrl: getSiteUrl(),
    recipientEmail: request.contactEmail,
    recipientName: request.contactName,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      statusUrl: `${getSiteUrl()}/concierge/status/${request.id}`,
    },
  });
}

export async function notifyConciergeOfferSelectedClient(
  request: ConciergeRequest,
  offer: { vendorBusinessName: string; quotedPrice: number },
) {
  await sendKayEmail({
    type: "concierge_offer_selected_client",
    appUrl: getSiteUrl(),
    recipientEmail: request.contactEmail,
    recipientName: request.contactName,
    request: {
      referenceNumber: request.referenceNumber,
      productName: request.productName,
      vendorBusinessName: offer.vendorBusinessName,
      quotedPrice: offer.quotedPrice,
      statusUrl: `${getSiteUrl()}/concierge/status/${request.id}`,
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
    appUrl: getSiteUrl(),
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
    appUrl: getSiteUrl(),
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
    appUrl: getSiteUrl(),
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
