import type { CompareState } from "@/types/compare";

const COMPARE_KEY = "kay-compare";

const EMPTY: CompareState = { slugs: [], anchorSlug: null };

export function loadCompare(): CompareState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CompareState;
    if (!Array.isArray(parsed.slugs)) return EMPTY;
    return {
      slugs: parsed.slugs,
      anchorSlug: parsed.anchorSlug ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export function saveCompare(state: CompareState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPARE_KEY, JSON.stringify(state));
}
