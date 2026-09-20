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

export type GiftRevealOpenedEmailPayload = {
  type: "gift_reveal_opened";
  appUrl: string;
  to: string;
  buyerName: string;
  recipientName: string;
  orderNumber: string;
  orderId: string;
};

export type ConciergeEmailPayload = {
  type: "concierge";
  appUrl: string;
  request: ConciergeRequest;
  /** Every admin inbox; edge also merges KAY_TEAM_EMAIL. */
  adminEmails?: string[];
};

export type TableRequestSummary = {
  reference: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  category: string;
  occasion?: string;
  servings?: string;
  flavourNotes?: string;
  styleNotes?: string;
  neededBy?: string;
  fulfillmentMethod?: string;
  city?: string;
  state?: string;
  pickupHubName?: string;
  quoteAmount?: number;
  quoteNote?: string;
  assignedVendorName?: string;
  statusUrl?: string;
};

export type TableEmailPayload =
  | {
      type: "table_request";
      appUrl: string;
      adminEmails?: string[];
      request: TableRequestSummary;
    }
  | {
      type: "table_quote_ready";
      appUrl: string;
      request: TableRequestSummary;
    }
  | {
      type: "table_vendor_assigned";
      appUrl: string;
      vendor: {
        contactName: string;
        contactEmail: string;
        businessName: string;
      };
      request: TableRequestSummary;
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
  /** When true, email subject/body reads as a reminder. */
  reminder?: boolean;
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
  /** Every admin inbox for concierge_admin_alert; edge also merges KAY_TEAM_EMAIL. */
  adminEmails?: string[];
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

export type AuthOtpAction = "signup" | "recovery" | "magiclink" | "email_change";

export type AuthOtpEmailPayload = {
  type: "auth_otp";
  to: string;
  token: string;
  action: AuthOtpAction;
};

export type SupportMessageEmailPayload = {
  type: "support_message";
  appUrl: string;
  audience: "team" | "user";
  /** Required when audience is "user"; ignored for team (uses KAY_TEAM_EMAIL). */
  to?: string;
  preview: string;
  senderName?: string;
  deepLink: string;
  threadId: string;
};

export type KayEmailPayload =
  | OrderEmailPayload
  | ConciergeEmailPayload
  | ConciergeOfferEmailPayload
  | TableEmailPayload
  | ContactEmailPayload
  | VendorEmailPayload
  | RoleEmailPayload
  | AuthOtpEmailPayload
  | SupportMessageEmailPayload
  | GiftRevealOpenedEmailPayload;
