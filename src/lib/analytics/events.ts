/**
 * Typed catalogue of every custom PostHog event. Add new events here so names
 * and properties can't drift between call sites.
 *
 * Never put personal data (email, phone, address, names) in properties.
 */
export type AnalyticsEvents = {
  // Shopping funnel
  product_viewed: {
    product_id: string;
    slug: string;
    name: string;
    price: number;
    brand?: string | null;
  };
  product_added_to_cart: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    variation?: string | null;
  };
  product_removed_from_cart: { product_id: string };
  checkout_started: { item_count: number; subtotal: number };
  checkout_submitted: {
    delivery_type: "gift" | "self";
    item_count: number;
    subtotal: number;
    split: boolean;
    paystack: boolean;
  };
  checkout_failed: { reason: string };
  order_created: {
    order_id: string;
    delivery_type: "gift" | "self";
    item_count: number;
    subtotal: number;
  };
  search_performed: { query_length: number; results?: number };
  // Server-side, reliable events
  payment_confirmed: {
    order_id: string;
    amount?: number;
    gateway: string;
  };
  payment_failed: { order_id?: string; gateway: string; reason?: string };
  order_creation_failed: { reason: string };
};

export type AnalyticsEventName = keyof AnalyticsEvents;
