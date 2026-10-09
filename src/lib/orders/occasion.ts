import type { GiftDetails } from "@/types/order";

const PREP_DAYS = 1;

export function lagosToday(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

function parseEtaDays(eta?: string | null): number | null {
  if (!eta) return null;
  const nums = eta.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;
  const max = Math.max(...nums);
  if (/hour/i.test(eta)) return Math.max(1, Math.ceil(max / 24));
  return max;
}

/** Earliest the parcel can arrive: quoted transit, plus one prep day. */
export function earliestArrivalDate(quote?: {
  deliveryEta?: string | null;
  deliveryDate?: string | null;
} | null, now = new Date()): string | null {
  if (quote?.deliveryDate) {
    const parsed = new Date(quote.deliveryDate);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setDate(parsed.getDate() + PREP_DAYS);
      return parsed.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    }
  }
  const days = parseEtaDays(quote?.deliveryEta);
  if (days == null) return null;
  const arrival = new Date(now.getTime() + (days + PREP_DAYS) * 24 * 60 * 60 * 1000);
  return arrival.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

export function formatOccasionDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function deferRecipientEmail(gift?: GiftDetails | null, now = new Date()): boolean {
  if (!gift?.recipientEmail) return false;
  if (gift.recipientEmailOn !== "date" || !gift.occasionDate) return false;
  if (gift.recipientEmailSentAt) return false;
  return gift.occasionDate > lagosToday(now);
}
