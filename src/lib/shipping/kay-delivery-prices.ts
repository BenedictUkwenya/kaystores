import { PRICING_CONFIG } from "@/lib/pricing/config";

export type KayDeliveryChoice = {
  rateId: string;
  label: string;
  detail: string;
  amount: number;
};

export function isAbujaOrMinna(destination: { city?: string; state?: string }) {
  const city = (destination.city ?? "").trim().toLowerCase();
  const state = (destination.state ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+state$/, "");
  const abuja =
    city.includes("abuja") ||
    state === "abuja" ||
    state === "fct" ||
    state.includes("federal capital");
  return abuja || city.includes("minna");
}

/** Door delivery only. Abuja and Minna are ₦5,000. Everywhere else is ₦10,000. */
export function kayDeliveryChoices(destination: {
  city?: string;
  state?: string;
}): KayDeliveryChoice[] {
  const rates = PRICING_CONFIG.delivery;
  const local = isAbujaOrMinna(destination);
  return [
    {
      rateId: "manual-door",
      label: "Door delivery",
      detail: local ? "Abuja or Minna" : "Outside Abuja and Minna",
      amount: local ? rates.localDoor : rates.outsideDoor,
    },
  ];
}
