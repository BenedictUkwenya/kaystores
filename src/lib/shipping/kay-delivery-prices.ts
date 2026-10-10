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

/** Fixed Kay delivery prices. Door delivery replaces interstate in Abuja and Minna. */
export function kayDeliveryChoices(destination: {
  city?: string;
  state?: string;
}): KayDeliveryChoice[] {
  const rates = PRICING_CONFIG.delivery;
  const local = isAbujaOrMinna(destination);
  const choices: KayDeliveryChoice[] = [
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
