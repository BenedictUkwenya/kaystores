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
  budget?: number | null;
  category: TableRequestCategory;
  assignedVendorId?: string | null;
  assignedVendorName?: string | null;
  quoteAmount?: number | null;
  quoteNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TableRequestMessage = {
  id: string;
  requestId: string;
  senderId: string | null;
  senderRole: TableSenderRole;
  senderName: string;
  body: string;
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
  budget?: number;
  category?: TableRequestCategory;
  userId?: string | null;
};
