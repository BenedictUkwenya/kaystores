import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING_CONFIG } from "@/lib/pricing/config";
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

function isAbujaOrMinna(destination: AddressDetails) {
  const city = destination.city.trim().toLowerCase();
  const state = destination.state.trim().toLowerCase().replace(/\s+state$/, "");
  const abuja =
    city.includes("abuja") ||
    state === "abuja" ||
    state === "fct" ||
    state.includes("federal capital");
  const minna = city.includes("minna");
  return abuja || minna;
}

/** Fixed Kay delivery prices from the launch note. */
export function kayDeliveryChoices(destination: AddressDetails) {
  const rates = PRICING_CONFIG.delivery;
  const local = isAbujaOrMinna(destination);
  const choices: {
    rateId: string;
    label: string;
    detail: string;
    amount: number;
  }[] = [
    {
      rateId: "manual-hub",
      label: "Hub pickup",
      detail: "Collect from a Kay hub",
      amount: rates.hubPickup,
    },
    {
      rateId: "manual-home",
      label: "Home delivery",
      detail: "Brought to the address",
      amount: rates.home,
    },
  ];
  if (local) {
    choices.unshift({
      rateId: "manual-door",
      label: "Door delivery",
      detail: "Abuja or Minna",
      amount: rates.localDoor,
    });
  } else {
    choices.unshift({
      rateId: "manual-interstate",
      label: "Interstate",
      detail: "Fixed delivery outside Abuja and Minna",
      amount: rates.interstate,
    });
  }
  return choices;
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

  const quotes: ShippingQuote[] = [];
  for (const choice of kayDeliveryChoices(input.destination)) {
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
        destination: input.destination,
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
    });
  }
  return quotes;
}
