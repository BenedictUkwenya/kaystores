import type { CartItem } from "@/types/cart";

export type DeliveryType = "self" | "gift";

export type BuyerDetails = {
  fullName: string;
  email: string;
  phone: string;
};

export type AddressDetails = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
};

export type GiftDetails = {
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientWhatsApp?: string;
  note: string;
  anonymous: boolean;
  addressUnknown: boolean;
  recipientAddress?: AddressDetails;
};

export type OrderItem = Pick<
  CartItem,
  "productId" | "slug" | "name" | "brand" | "price" | "image" | "quantity"
>;

export type Order = {
  id: string;
  orderNumber: string;
  status: "confirmed" | "pending_handover" | "processing";
  deliveryType: DeliveryType;
  items: OrderItem[];
  subtotal: number;
  buyer: BuyerDetails;
  buyerAddress?: AddressDetails;
  gift?: GiftDetails;
  handoverToken?: string;
  handoverStatus: "not_required" | "pending" | "completed";
  recipientAddress?: AddressDetails;
  createdAt: string;
};

export type CreateOrderPayload = {
  deliveryType: DeliveryType;
  items: OrderItem[];
  subtotal: number;
  buyer: BuyerDetails;
  buyerAddress?: AddressDetails;
  gift?: GiftDetails;
};

export const GIFT_NOTE_MAX_LENGTH = 200;
