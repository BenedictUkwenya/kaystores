import type { ConciergePaymentBreakdown } from "@/lib/pricing/concierge";

export type ConciergePaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type ConciergeClientResponse =
  | "none"
  | "pending"
  | "accepted"
  | "needs_revision"
  | "cancelled";

export type ConciergeRequestStatus =
  | "pending"
  | "with_vendors"
  | "offers_ready"
  | "client_reviewing"
  | "revision_requested"
  | "vendor_selected"
  | "in_fulfilment"
  | "in_progress"
  | "completed"
  | "closed";

export type ConciergeVendorResponse =
  | "pending"
  | "has_product"
  | "no_product"
  | "need_more_info";

export type ConciergeAssignmentOutcome =
  | "pending"
  | "published"
  | "selected"
  | "not_chosen";

export type ConciergeFulfilmentStatus =
  | "pending"
  | "sourcing"
  | "at_hub"
  | "completed";

export type ConciergeQueueFilter =
  | "all"
  | "needs_dispatch"
  | "awaiting_quotes"
  | "ready_to_release"
  | "client_deciding"
  | "in_fulfilment"
  | "closed";

export type ConciergeAttachment = {
  name: string;
  path: string;
  contentType: string;
};

export type ConciergeRequest = {
  id: string;
  referenceNumber: string;
  productName: string;
  brand: string;
  budget: number;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  attachmentNames: string[];
  attachments: ConciergeAttachment[];
  status: ConciergeRequestStatus;
  userId?: string | null;
  adminNotes?: string | null;
  dispatchedAt?: string | null;
  selectedAssignmentId?: string | null;
  recommendedAssignmentId?: string | null;
  recommendedAt?: string | null;
  clientFeedback?: string;
  clientResponse?: ConciergeClientResponse;
  clientSelectedAt?: string | null;
  offersReleasedAt?: string | null;
  autoReleaseOffers: boolean;
  contactReleasedAt?: string | null;
  paymentStatus?: ConciergePaymentStatus;
  paymentAmount?: number | null;
  paidAt?: string | null;
  createdAt: string;
};

export type ConciergeVendorAssignment = {
  id: string;
  conciergeRequestId: string;
  vendorId: string;
  vendorBusinessName?: string;
  status: ConciergeVendorResponse;
  vendorNotes: string;
  quotedPrice: number | null;
  offerImages: ConciergeAttachment[];
  publishedToClient: boolean;
  outcome: ConciergeAssignmentOutcome;
  fulfilmentStatus: ConciergeFulfilmentStatus;
  sentAt: string;
  respondedAt: string | null;
};

export type ConciergeRequestWithAssignments = ConciergeRequest & {
  assignments: ConciergeVendorAssignment[];
};

export type ClientConciergeOffer = {
  assignmentId: string;
  vendorBusinessName: string;
  quotedPrice: number;
  vendorNotes: string;
  offerImages: (ConciergeAttachment & { url: string })[];
  outcome: ConciergeAssignmentOutcome;
};

export type ClientConciergeDetail = ClientConciergeStatus & {
  description: string;
  brand: string;
  /** Kay's curated recommendation — only one offer shown to client */
  recommendedOffer: ClientConciergeOffer | null;
  selectedAssignmentId: string | null;
  canAccept: boolean;
  canRevise: boolean;
  canCancel: boolean;
  paymentStatus: ConciergePaymentStatus;
  canPay: boolean;
  paymentBreakdown: ConciergePaymentBreakdown | null;
};

export type VendorConciergeItem = {
  assignmentId: string;
  requestId: string;
  referenceNumber: string;
  productName: string;
  brand: string;
  budget: number;
  description: string;
  attachmentNames: string[];
  referenceAttachments: ConciergeAttachment[];
  status: ConciergeVendorResponse;
  vendorNotes: string;
  quotedPrice: number | null;
  offerImages: ConciergeAttachment[];
  outcome: ConciergeAssignmentOutcome;
  fulfilmentStatus: ConciergeFulfilmentStatus;
  requestPaymentStatus: ConciergePaymentStatus;
  sentAt: string;
  respondedAt: string | null;
};

export type CreateConciergePayload = {
  productName: string;
  brand: string;
  budget: number;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  attachmentNames: string[];
  attachments?: ConciergeAttachment[];
  id?: string;
};

export type DispatchConciergePayload = {
  requestId: string;
  vendorIds: string[] | "all";
};

export type RespondConciergePayload = {
  assignmentId: string;
  status: Exclude<ConciergeVendorResponse, "pending">;
  vendorNotes?: string;
  quotedPrice?: number | null;
  offerImages?: ConciergeAttachment[];
};

/** Client-safe view — no vendor or internal admin details */
export type ClientConciergeStatus = {
  id: string;
  referenceNumber: string;
  productName: string;
  brand: string;
  budget: number;
  status: ConciergeRequestStatus;
  createdAt: string;
};

export type ConciergeQueueCounts = {
  needsDispatch: number;
  awaitingQuotes: number;
  readyToRelease: number;
  clientDeciding: number;
  inFulfilment: number;
  closed: number;
};
