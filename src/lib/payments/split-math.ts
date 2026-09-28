import { isTestCheckoutMode } from "@/lib/pricing/config";

export const SPLIT_MIN_PEOPLE = 2;
export const SPLIT_MAX_PEOPLE = 10;
export const SPLIT_WINDOW_HOURS = 72;

/** Smallest share Paystack + Kay will accept. */
export function minShareAmount(): number {
  return isTestCheckoutMode() ? 100 : 1000;
}

/** Whole-naira shares; any remainder (incl. kobo) lands on the last share. */
export function splitAmounts(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const amounts = Array.from({ length: count }, () => base);
  const rest = Math.round((total - base * count) * 100) / 100;
  amounts[count - 1] = Math.round((base + rest) * 100) / 100;
  return amounts;
}

/** Most people this total can be split between. */
export function maxSplitPeople(total: number): number {
  return Math.max(
    0,
    Math.min(SPLIT_MAX_PEOPLE, Math.floor(total / minShareAmount())),
  );
}

export function validateSplitCount(total: number, count: number): string | null {
  if (!Number.isInteger(count) || count < SPLIT_MIN_PEOPLE || count > SPLIT_MAX_PEOPLE) {
    return `Split between ${SPLIT_MIN_PEOPLE} and ${SPLIT_MAX_PEOPLE} people.`;
  }
  const min = minShareAmount();
  if (Math.floor(total / count) < min) {
    return `Each share must be at least ₦${min.toLocaleString("en-NG")}. Try fewer people.`;
  }
  return null;
}
