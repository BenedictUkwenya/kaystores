import type { ChatChannel } from "@/types/order-support";

export type { ChatChannel };

export type TableRequestStatus =
  | "submitted"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "declined"
  | "fulfilled";

export type TableRequestCategory =
  | "cake"
  | "chocolate"
  | "hamper"
  | "treat"
  | "other";

export type TableFulfillmentMethod = "delivery" | "pickup";

export type TableSenderRole = "customer" | "vendor" | "admin";

export type TableRequest = {
  id: string;
  reference: string;
  status: TableRequestStatus;
  userId?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  occasion?: string | null;
  servings?: string | null;
  flavourNotes?: string | null;
  styleNotes?: string | null;
  neededBy?: string | null;
  city?: string | null;
  state?: string | null;
  fulfillmentMethod: TableFulfillmentMethod;
  pickupHubId?: string | null;
  pickupHubName?: string | null;
  budget?: number | null;
  category: TableRequestCategory;
  assignedVendorId?: string | null;
  assignedVendorName?: string | null;
  quoteAmount?: number | null;
  quoteNote?: string | null;
  paymentStatus: TablePaymentStatus;
  paymentReference?: string | null;
  paidAt?: string | null;
  deliveryAddress?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  allergies?: string | null;
  messageOnItem?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TablePaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type TableRequestMessage = {
  id: string;
  requestId: string;
  senderId: string | null;
  senderRole: TableSenderRole;
  senderName: string;
  body: string;
  channel: ChatChannel;
  createdAt: string;
};

export type CreateTableRequestInput = {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  occasion?: string;
  servings?: string;
  flavourNotes?: string;
  styleNotes?: string;
  neededBy?: string;
  city?: string;
  state?: string;
  fulfillmentMethod?: TableFulfillmentMethod;
  pickupHubId?: string;
  pickupHubName?: string;
  budget?: number;
  category?: TableRequestCategory;
  userId?: string | null;
  deliveryAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  allergies?: string;
  messageOnItem?: string;
};
