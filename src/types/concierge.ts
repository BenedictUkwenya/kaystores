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
  status: "pending" | "reviewing" | "sourced" | "closed";
  createdAt: string;
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
};
