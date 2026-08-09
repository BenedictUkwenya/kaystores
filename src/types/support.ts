export type SupportThreadStatus = "open" | "closed";
export type SupportSenderRole = "customer" | "vendor" | "admin";

export type SupportThread = {
  id: string;
  userId: string;
  subject: string;
  status: SupportThreadStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: SupportSenderRole;
  body: string | null;
  imagePath: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

export type SupportThreadListItem = SupportThread & {
  userEmail?: string | null;
  userName?: string | null;
  lastPreview?: string | null;
  lastSenderRole?: SupportSenderRole | null;
  needsAttention?: boolean;
};
