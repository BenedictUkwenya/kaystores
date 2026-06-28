import type {
  AddressDetails,
  BuyerDetails,
  DeliveryType,
  GiftDetails,
  Order,
  OrderItem,
  OrderSummary,
  OrderTracking,
} from "@/types/order";
import type { OrderPricingPayload } from "@/lib/pricing/calculate";

export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  delivery_type: DeliveryType;
  items: OrderItem[];
  subtotal: number;
  pricing: OrderPricingPayload | null;
  buyer: BuyerDetails;
  buyer_address: AddressDetails | null;
  gift: GiftDetails | null;
  handover_token: string | null;
  handover_status: string;
  recipient_address: AddressDetails | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
};

function mapTracking(row: OrderRow): OrderTracking | undefined {
  if (!row.tracking_number && !row.tracking_url && !row.tracking_carrier) {
    return undefined;
  }
  return {
    carrier: row.tracking_carrier ?? undefined,
    number: row.tracking_number ?? undefined,
    url: row.tracking_url ?? undefined,
  };
}

export function mapOrderRow(row: OrderRow): Order {
  const pricing =
    row.pricing ??
    ({
      productSubtotal: row.subtotal,
      curationFeeTotal: 0,
      deliveryFee: 0,
      tax: 0,
      grandTotal: row.subtotal,
      segments: [],
    } as OrderPricingPayload);

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id ?? undefined,
    status: row.status as Order["status"],
    deliveryType: row.delivery_type,
    items: row.items,
    subtotal: row.subtotal,
    pricing,
    buyer: row.buyer,
    buyerAddress: row.buyer_address ?? undefined,
    gift: row.gift ?? undefined,
    handoverToken: row.handover_token ?? undefined,
    handoverStatus: row.handover_status as Order["handoverStatus"],
    recipientAddress: row.recipient_address ?? undefined,
    tracking: mapTracking(row),
    createdAt: row.created_at,
  };
}

export function mapOrderSummary(
  row: Pick<
    OrderRow,
    | "id"
    | "order_number"
    | "status"
    | "delivery_type"
    | "pricing"
    | "subtotal"
    | "created_at"
  >,
): OrderSummary {
  const pricing =
    row.pricing ??
    ({
      productSubtotal: row.subtotal,
      curationFeeTotal: 0,
      deliveryFee: 0,
      tax: 0,
      grandTotal: row.subtotal,
      segments: [],
    } as OrderPricingPayload);

  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status as Order["status"],
    pricing,
    createdAt: row.created_at,
    deliveryType: row.delivery_type,
  };
}

export function buildOrderInsert(row: {
  id: string;
  orderNumber: string;
  userId?: string;
  status: Order["status"];
  deliveryType: DeliveryType;
  items: OrderItem[];
  subtotal: number;
  pricing: OrderPricingPayload;
  buyer: BuyerDetails;
  buyerAddress?: AddressDetails;
  gift?: GiftDetails;
  handoverToken?: string;
  handoverStatus: Order["handoverStatus"];
}) {
  return {
    id: row.id,
    order_number: row.orderNumber,
    user_id: row.userId ?? null,
    status: row.status,
    delivery_type: row.deliveryType,
    items: row.items,
    subtotal: row.subtotal,
    pricing: row.pricing,
    buyer: row.buyer,
    buyer_address: row.buyerAddress ?? null,
    gift: row.gift ?? null,
    handover_token: row.handoverToken ?? null,
    handover_status: row.handoverStatus,
    recipient_address: null,
  };
}
