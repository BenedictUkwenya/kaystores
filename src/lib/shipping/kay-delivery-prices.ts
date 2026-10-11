import { PRICING_CONFIG } from "@/lib/pricing/config";

export type DoorZone = "abuja" | "minna" | "outside";

export type KayDeliveryChoice = {
  rateId: string;
  label: string;
  detail: string;
  amount: number;
  zone: DoorZone;
};

type Destination = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  formattedAddress?: string;
};

function locationText(destination: Destination) {
  return [
    destination.city,
    destination.state,
    destination.line1,
    destination.line2,
    destination.formattedAddress,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Abuja or Minna anywhere in the address the shopper added. Otherwise outside. */
export function doorZone(destination: Destination): DoorZone {
  const text = locationText(destination);
  if (/\bminna\b/.test(text)) return "minna";
  if (/\babuja\b/.test(text) || /\bfct\b/.test(text) || text.includes("federal capital")) {
    return "abuja";
  }
  return "outside";
}

export function isAbujaOrMinna(destination: Destination) {
  return doorZone(destination) !== "outside";
}

const ZONE_DETAIL: Record<DoorZone, string> = {
  abuja: "Abuja",
  minna: "Minna",
  outside: "Outside Abuja and Minna",
};

/** One door rate, chosen from the address. Abuja and Minna are ₦5,000. */
export function kayDeliveryChoices(destination: Destination): KayDeliveryChoice[] {
  const rates = PRICING_CONFIG.delivery;
  const zone = doorZone(destination);
  return [
    {
      rateId: "manual-door",
      label: "Door delivery",
      detail: ZONE_DETAIL[zone],
      amount: zone === "outside" ? rates.outsideDoor : rates.localDoor,
      zone,
    },
  ];
}
