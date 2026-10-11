import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { kayDeliveryChoices } from "@/lib/shipping/kay-delivery-prices";
import { matchNigerianState } from "@/lib/geo/nigeria";
import { getShippingSettings } from "@/lib/shipping/settings";
import { MANUAL_SHIPMENT_ID } from "@/types/shipping-settings";
import type { AddressDetails, OrderItem } from "@/types/order";
import type { ShippingQuote } from "@/lib/shipping/terminal";
import { createHash } from "crypto";

function cartFingerprint(items: OrderItem[]) {
  return createHash("sha256")
    .update(items.map((item) => `${item.productId}:${item.quantity}`).sort().join("|"))
    .digest("hex");
}

export async function createKayDeliveryQuotes(input: {
  items: OrderItem[];
  destination: AddressDetails;
}): Promise<ShippingQuote[]> {
  const settings = await getShippingSettings();
  if (!settings.manualEnabled) {
    throw new Error("Kay delivery is not available right now.");
  }
  const admin = createAdminClient();
  if (!admin) throw new Error("Shipping is temporarily unavailable.");

  const destination: AddressDetails = {
    ...input.destination,
    city: input.destination.city.trim(),
    state: matchNigerianState(input.destination.state) ?? input.destination.state.trim(),
  };
  const quotes: ShippingQuote[] = [];
  for (const choice of kayDeliveryChoices(destination)) {
    const { data, error } = await admin
      .from("shipping_quotes")
      .insert({
        terminal_shipment_id: MANUAL_SHIPMENT_ID,
        terminal_rate_id: choice.rateId,
        carrier_name: choice.label,
        service_name: choice.detail,
        amount: choice.amount,
        currency: "NGN",
        delivery_eta: choice.detail,
        delivery_date: null,
        destination,
        cart_fingerprint: cartFingerprint(input.items),
        hub_id: null,
      })
      .select("token")
      .single();
    if (error || !data) throw new Error("Could not create Kay delivery option.");
    quotes.push({
      token: data.token,
      carrierName: choice.label,
      serviceName: choice.detail,
      amount: choice.amount,
      currency: "NGN",
      deliveryEta: choice.detail,
      hubName: "Kay",
      kind: "manual",
      rateId: choice.rateId,
    });
  }
  return quotes;
}
