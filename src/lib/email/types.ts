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
    | "vendor_product_approved"
    | "vendor_product_rejected"
    | "vendor_withdrawal_update";
  appUrl: string;
  vendor: {
    contactName: string;
    contactEmail: string;
    businessName: string;
  };
  productName?: string;
  rejectionReason?: string;
  withdrawalAmount?: number;
  withdrawalStatus?: string;
};

export type KayEmailPayload =
  | OrderEmailPayload
  | ConciergeEmailPayload
  | ContactEmailPayload
  | VendorEmailPayload;
