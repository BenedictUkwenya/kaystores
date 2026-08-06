import type { Order } from "@/types/order";
import type { ConciergeRequest } from "@/types/concierge";

export type OrderEmailPayload = {
  type:
    | "order_confirmation"
    | "order_internal"
    | "handover_link"
    | "handover_completed"
    | "gift_recipient";
  appUrl: string;
  order: Order;
};

export type ConciergeEmailPayload = {
  type: "concierge";
  appUrl: string;
  request: ConciergeRequest;
};

export type ContactEmailPayload = {
  type: "contact";
  appUrl: string;
  contact: {
    firstName?: string;
    lastName?: string;
    email: string;
    subject?: string;
    message: string;
  };
};

export type VendorEmailPayload = {
  type:
    | "vendor_application_received"
    | "vendor_approved"
    | "vendor_application_rejected"
    | "vendor_product_approved"
    | "vendor_product_rejected"
    | "vendor_withdrawal_update"
    | "vendor_concierge_assigned"
    | "vendor_new_order";
  appUrl: string;
  vendor: {
    contactName: string;
    contactEmail: string;
    businessName: string;
  };
  productName?: string;
  orderNumber?: string;
  lineSummary?: string;
  rejectionReason?: string;
  withdrawalAmount?: number;
  withdrawalStatus?: string;
  request?: {
    referenceNumber: string;
    productName: string;
    brand: string;
    budget: number;
    description: string;
  };
};

export type RoleEmailPayload = {
  type: "role_invite" | "role_upgraded";
  appUrl: string;
  recipientEmail: string;
  recipientName?: string;
  role: "admin" | "vendor";
  inviteUrl?: string;
  businessName?: string;
};

export type ConciergeOfferEmailPayload = {
  type:
    | "concierge_offers_ready"
    | "concierge_recommendation_ready"
    | "concierge_offer_selected_client"
    | "concierge_offer_won"
    | "concierge_offer_lost"
    | "concierge_admin_alert";
  appUrl: string;
  recipientEmail?: string;
  recipientName?: string;
  alertTitle?: string;
  alertDetail?: string;
  vendor?: {
    contactName: string;
    contactEmail: string;
    businessName: string;
  };
  request: {
    referenceNumber: string;
    productName: string;
    brand?: string;
    budget?: number;
    description?: string;
    vendorBusinessName?: string;
    quotedPrice?: number;
    statusUrl?: string;
  };
};

export type KayEmailPayload =
  | OrderEmailPayload
  | ConciergeEmailPayload
  | ConciergeOfferEmailPayload
  | ContactEmailPayload
  | VendorEmailPayload
  | RoleEmailPayload;
