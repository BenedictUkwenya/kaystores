export type UserRole = "customer" | "vendor" | "admin";

export type AccountStatus = "active" | "suspended" | "blocked";

export type Profile = {
  id: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  accountStatus?: AccountStatus;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  statusReason: string | null;
  createdAt: string;
  vendorStatus?: VendorStatus | null;
  businessName?: string | null;
};

export type VendorStatus = "pending" | "approved" | "suspended" | "rejected";

export type ProductStatus =
  | "draft"
  | "pending_review"
  | "live"
  | "rejected"
  | "archived";

export type FulfillmentStatus =
  | "awaiting_payment"
  | "awaiting_hub_delivery"
  | "at_hub"
  | "qc_passed"
  | "dispatched"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type EarningStatus = "pending" | "available" | "paid_out";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "processing"
  | "paid"
  | "rejected";

export type VendorOnboardingSource = "invite" | "self_apply";

export type VendorInviteMode = "instant" | "profile";

export type Vendor = {
  id: string;
  userId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  catalogDescription: string;
  nin: string | null;
  onboardingSource: VendorOnboardingSource;
  status: VendorStatus;
  canListAfterDark: boolean;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  inviteToken: string | null;
  approvedAt: string | null;
  createdAt: string;
};

export type VendorOrderItem = {
  id: string;
  orderId: string;
  vendorId: string;
  productId: string;
  productName: string;
  segment: "gifting" | "after_dark";
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vendorEarnings: number;
  fulfillmentStatus: FulfillmentStatus;
  hubNotes: string | null;
  createdAt: string;
  orderNumber?: string;
  paymentStatus?: PaymentStatus;
};

export type VendorEarning = {
  id: string;
  vendorId: string;
  vendorOrderItemId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: EarningStatus;
  createdAt: string;
};

export type WithdrawalRequest = {
  id: string;
  vendorId: string;
  amount: number;
  status: WithdrawalStatus;
  bankSnapshot: Record<string, string>;
  adminNote: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
  vendor?: Pick<Vendor, "businessName" | "contactEmail">;
};

export type AdminOverview = {
  ordersToday: number;
  gmvToday: number;
  pendingVendorApplications: number;
  pendingWithdrawals: number;
  pendingConcierge: number;
  totalVendors: number;
  liveProducts: number;
  totalUsers: number;
};
