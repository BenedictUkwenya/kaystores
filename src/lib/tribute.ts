/**
 * "Thank you, Messi" tribute window.
 * Stylised only (number 10, sky-blue stripes, golden ball) — no likeness.
 * Override from Vercel with NEXT_PUBLIC_MESSI_TRIBUTE_START / _END.
 */

export const TRIBUTE_START =
  process.env.NEXT_PUBLIC_MESSI_TRIBUTE_START?.trim() || "2026-10-06T00:00:00+01:00";

export const TRIBUTE_END =
  process.env.NEXT_PUBLIC_MESSI_TRIBUTE_END?.trim() || "2026-10-08T23:59:59+01:00";

export function isTributeActive(now = Date.now()): boolean {
  const start = new Date(TRIBUTE_START).getTime();
  const end = new Date(TRIBUTE_END).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return now >= start && now <= end;
}

export const TRIBUTE_COPY = {
  eyebrow: "A Kay Stores tribute · 6 to 8 October",
  headline: "Thank you, Messi.",
  sub: "The greatest to ever do it. One last dance for Argentina.",
  spanish: "Gracias, Leo.",
  picksTitle: "Messi's Picks",
  picksSub: "What we'd gift the GOAT.",
  ballTooltip: "Thank you, Messi. See his picks",
} as const;

export const MESSI_QUOTES: readonly string[] = [
  "You have to fight to reach your dream. You have to sacrifice and work hard for it.",
  "I start early and I stay late, day after day, year after year. It took me 17 years and 114 days to become an overnight success.",
  "The best decisions aren't made with your mind, but with your instinct.",
  "Something deep in my character allows me to take the hits and get on with trying to win.",
  "I always thought I wanted to play professionally, and I always knew that to do that I'd have to make a lot of sacrifices.",
  "There's nothing more satisfying than seeing a happy and smiling child.",
  "I prefer to win titles with the team ahead of individual awards or scoring more goals than anyone else.",
];

/** Catalogue types we'd happily gift the number 10. */
export const MESSI_PICK_TYPES = ["Watch", "Sneaker", "Slide", "Perfume", "Phone"] as const;

export const TRIBUTE_HIDDEN_PREFIXES = [
  "/admin",
  "/vendor",
  "/checkout",
  "/after-dark",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/handover",
  "/reveal",
  "/split",
];

export function isTributeHiddenRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return TRIBUTE_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
