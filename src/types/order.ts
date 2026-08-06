import type { CartItem } from "@/types/cart";
import type { OrderPricingPayload } from "@/lib/pricing/calculate";

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
  | "productId"
  | "slug"
  | "name"
  | "brand"
  | "price"
  | "image"
  | "quantity"
  | "segment"
  | "vendorId"
>;

export type OrderStatus =
  | "confirmed"
  | "pending_handover"
  | "processing"
  | "shipped"
  | "delivered";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type OrderTracking = {
  carrier?: string;
  number?: string;
  url?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId?: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  items: OrderItem[];
  /** @deprecated use pricing.productSubtotal */
  subtotal: number;
  pricing: OrderPricingPayload;
  buyer: BuyerDetails;
  buyerAddress?: AddressDetails;
  gift?: GiftDetails;
  handoverToken?: string;
  handoverStatus: "not_required" | "pending" | "completed";
  recipientAddress?: AddressDetails;
  tracking?: OrderTracking;
  paymentStatus?: PaymentStatus;
  paymentReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

export type OrderSummary = Pick<
  Order,
  "id" | "orderNumber" | "status" | "pricing" | "createdAt" | "deliveryType"
>;

export type CreateOrderPayload = {
  deliveryType: DeliveryType;
  items: OrderItem[];
  subtotal: number;
  pricing: OrderPricingPayload;
  buyer: BuyerDetails;
  buyerAddress?: AddressDetails;
  gift?: GiftDetails;
};

export const GIFT_NOTE_MAX_LENGTH = 200;
