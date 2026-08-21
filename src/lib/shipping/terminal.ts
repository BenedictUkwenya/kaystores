import "server-only";

import { createHash } from "crypto";
import type { AddressDetails, BuyerDetails, Order, OrderItem } from "@/types/order";
import { createAdminClient } from "@/lib/supabase/admin";

const API_URL = "https://api.terminal.africa/v1";

type TerminalAddress = {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  is_residential: boolean;
};

type TerminalRate = {
  id?: string;
  rate_id?: string;
  amount: number;
  currency: string;
  carrier_name: string;
  carrier_rate_description?: string;
  delivery_time?: string;
  delivery_date?: string;
};

type TerminalShipment = {
  shipment_id?: string;
  id?: string;
  status?: string;
  extras?: {
    tracking_number?: string;
    tracking_url?: string;
    carrier_tracking_url?: string;
    shipping_label?: string;
  };
};

export type ShippingQuote = {
  token: string;
  carrierName: string;
  serviceName?: string;
  amount: number;
  currency: string;
  deliveryEta?: string;
  deliveryDate?: string;
};

function config() {
  const secret = process.env.TERMINAL_AFRICA_SECRET_KEY;
  const pickup = process.env.TERMINAL_HUB_ADDRESS_JSON;
  const name = process.env.TERMINAL_HUB_CONTACT_NAME;
  const email = process.env.TERMINAL_HUB_CONTACT_EMAIL;
  const phone = process.env.TERMINAL_HUB_CONTACT_PHONE;
  if (!secret || !pickup || !name || !email || !phone) {
    throw new Error("Shipping is not configured. Please contact Kay Stores.");
  }

  let address: AddressDetails;
  try {
    address = JSON.parse(pickup) as AddressDetails;
  } catch {
    throw new Error("Terminal hub address is invalid.");
  }
  return { secret, address, contact: { fullName: name, email, phone } };
}

async function terminalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { secret } = config();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as
    | { data?: T; message?: string }
    | null;
  if (!response.ok || !body?.data) {
    throw new Error(body?.message ?? "Could not retrieve live delivery rates.");
  }
  return body.data;
}

function toTerminalAddress(address: AddressDetails, contact: BuyerDetails): TerminalAddress {
  const [firstName, ...rest] = contact.fullName.trim().split(/\s+/);
  return {
    name: contact.fullName,
    first_name: firstName || "Kay",
    last_name: rest.join(" ") || firstName || "Customer",
    email: contact.email,
    phone: contact.phone,
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    ...(address.postalCode ? { zip: address.postalCode } : {}),
    country: address.country === "Nigeria" ? "NGA" : address.country,
    is_residential: true,
  };
}

async function getParcel(items: OrderItem[]) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Shipping is temporarily unavailable.");
  const { data, error } = await admin
    .from("products")
    .select("id, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm")
    .in("id", items.map((item) => item.productId));
  if (error) throw new Error("Could not prepare this order for shipping.");

  const byId = new Map((data ?? []).map((product) => [product.id, product]));
  const missing = items.some((item) => {
    const product = byId.get(item.productId);
    return !product?.shipping_weight_kg || !product?.shipping_length_cm ||
      !product?.shipping_width_cm || !product?.shipping_height_cm;
  });
  if (missing) {
    throw new Error("One or more gifts are not yet configured for delivery.");
  }

  const totalWeight = items.reduce((total, item) => {
    const product = byId.get(item.productId)!;
    return total + Number(product.shipping_weight_kg) * item.quantity;
  }, 0);
  const length = Math.max(...items.map((item) => Number(byId.get(item.productId)!.shipping_length_cm)));
  const width = Math.max(...items.map((item) => Number(byId.get(item.productId)!.shipping_width_cm)));
  const height = items.reduce(
    (total, item) => total + Number(byId.get(item.productId)!.shipping_height_cm) * item.quantity,
    0,
  );

  return {
    weight: totalWeight,
    weight_unit: "kg",
    length,
    width,
    height,
    dimension_unit: "cm",
    description: "Kay Stores order",
    items: items.map((item) => ({
      name: item.name,
      description: item.name,
      currency: "NGN",
      value: item.price,
      quantity: item.quantity,
      weight: Number(byId.get(item.productId)!.shipping_weight_kg),
    })),
  };
}

function cartFingerprint(items: OrderItem[]) {
  return createHash("sha256")
    .update(items.map((item) => `${item.productId}:${item.quantity}`).sort().join("|"))
    .digest("hex");
}

export async function quoteTerminalShipping(input: {
  items: OrderItem[];
  destination: AddressDetails;
  recipient: BuyerDetails;
}): Promise<ShippingQuote[]> {
  const { address, contact } = config();
  const parcel = await getParcel(input.items);
  const shipment = await terminalFetch<TerminalShipment>("/shipments/quick", {
    method: "POST",
    body: JSON.stringify({
      pickup_address: toTerminalAddress(address, contact),
      return_address: toTerminalAddress(address, contact),
      delivery_address: toTerminalAddress(input.destination, input.recipient),
      parcel,
      shipment_purpose: "commercial",
      metadata: { source: "kay-stores", cart_fingerprint: cartFingerprint(input.items) },
    }),
  });
  const shipmentId = shipment.shipment_id ?? shipment.id;
  if (!shipmentId) throw new Error("Terminal did not return a shipment reference.");
  const rates = await terminalFetch<TerminalRate[]>(`/rates/shipment?shipment_id=${encodeURIComponent(shipmentId)}&currency=NGN`);
  const admin = createAdminClient();
  if (!admin) throw new Error("Shipping is temporarily unavailable.");

  const quotes: ShippingQuote[] = [];
  for (const rate of rates) {
    const rateId = rate.rate_id ?? rate.id;
    if (!rateId || !Number.isFinite(Number(rate.amount))) continue;
    const { data, error } = await admin.from("shipping_quotes").insert({
      terminal_shipment_id: shipmentId,
      terminal_rate_id: rateId,
      carrier_name: rate.carrier_name,
      service_name: rate.carrier_rate_description ?? null,
      amount: Math.round(Number(rate.amount)),
      currency: rate.currency || "NGN",
      delivery_eta: rate.delivery_time ?? null,
      delivery_date: rate.delivery_date ?? null,
      destination: input.destination,
      cart_fingerprint: cartFingerprint(input.items),
    }).select("token").single();
    if (error || !data) throw new Error("Could not save delivery rate.");
    quotes.push({
      token: data.token,
      carrierName: rate.carrier_name,
      serviceName: rate.carrier_rate_description,
      amount: Math.round(Number(rate.amount)),
      currency: rate.currency || "NGN",
      deliveryEta: rate.delivery_time,
      deliveryDate: rate.delivery_date,
    });
  }
  return quotes.sort((a, b) => a.amount - b.amount);
}

export async function attachQuoteToOrder(orderId: string, token: string, items: OrderItem[]) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Shipping is temporarily unavailable.");
  const { data, error } = await admin
    .from("shipping_quotes")
    .update({ order_id: orderId, selected_at: new Date().toISOString() })
    .eq("token", token)
    .eq("cart_fingerprint", cartFingerprint(items))
    .gt("expires_at", new Date().toISOString())
    .is("order_id", null)
    .select("amount")
    .maybeSingle();
  if (error || !data) throw new Error("This delivery rate has expired. Please select a new rate.");
  return Number(data.amount);
}

export async function getSelectedQuoteAmount(token: string, items: OrderItem[]) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Shipping is temporarily unavailable.");
  const { data, error } = await admin
    .from("shipping_quotes")
    .select("amount")
    .eq("token", token)
    .eq("cart_fingerprint", cartFingerprint(items))
    .gt("expires_at", new Date().toISOString())
    .is("order_id", null)
    .maybeSingle();
  if (error || !data) throw new Error("This delivery rate has expired. Please select a new rate.");
  return Number(data.amount);
}

export async function arrangeTerminalShipment(order: Order) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Shipping is temporarily unavailable.");
  const { data: existing } = await admin.from("shipments").select("id").eq("order_id", order.id).maybeSingle();
  if (existing) return;
  const { data: quote, error } = await admin
    .from("shipping_quotes")
    .select("*")
    .eq("order_id", order.id)
    .maybeSingle();
  if (error || !quote) throw new Error("No selected Terminal delivery rate was found.");

  const shipment = await terminalFetch<TerminalShipment>("/shipments/pickup", {
    method: "POST",
    body: JSON.stringify({
      shipment_id: quote.terminal_shipment_id,
      rate_id: quote.terminal_rate_id,
    }),
  });
  const terminalShipmentId = shipment.shipment_id ?? shipment.id ?? quote.terminal_shipment_id;
  const extras = shipment.extras ?? {};
  const trackingUrl = extras.tracking_url ?? extras.carrier_tracking_url ?? null;
  const { error: insertError } = await admin.from("shipments").insert({
    order_id: order.id,
    shipping_quote_id: quote.id,
    terminal_shipment_id: terminalShipmentId,
    terminal_rate_id: quote.terminal_rate_id,
    carrier_name: quote.carrier_name,
    tracking_number: extras.tracking_number ?? null,
    tracking_url: trackingUrl,
    label_url: extras.shipping_label ?? null,
    status: shipment.status ?? "confirmed",
    arranged_at: new Date().toISOString(),
  });
  if (insertError) throw new Error("Could not save Terminal shipment.");
  await admin.from("orders").update({
    status: "shipped",
    tracking_carrier: quote.carrier_name,
    tracking_number: extras.tracking_number ?? null,
    tracking_url: trackingUrl,
  }).eq("id", order.id);
  // Enum exists but was unused — hub QC finished; outbound carrier now owns delivery.
  await admin
    .from("vendor_order_items")
    .update({
      fulfillment_status: "dispatched",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", order.id)
    .eq("fulfillment_status", "qc_passed");
}
