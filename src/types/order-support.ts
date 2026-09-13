export type OrderSupportRole = "admin" | "vendor" | "customer";

export type OrderSupportMessage = {
  id: string;
  orderId: string;
  senderId: string | null;
  senderRole: OrderSupportRole;
  senderName: string;
  body: string;
  createdAt: string;
};
