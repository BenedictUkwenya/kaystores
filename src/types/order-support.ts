export type OrderSupportRole = "admin" | "vendor" | "customer";

/** customer = customer<->admin thread, vendor = vendor<->admin thread. */
export type ChatChannel = "customer" | "vendor";

export type OrderSupportMessage = {
  id: string;
  orderId: string;
  senderId: string | null;
  senderRole: OrderSupportRole;
  senderName: string;
  body: string;
  channel: ChatChannel;
  createdAt: string;
};

export function parseChatChannel(value: unknown): ChatChannel | null {
  return value === "customer" || value === "vendor" ? value : null;
}
