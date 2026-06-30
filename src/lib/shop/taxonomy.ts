/**
 * Kay catalog taxonomy — single source of truth for product placement.
 *
 * Nav categories filter products by array fields on `products`:
 * - occasions  → /gifts/occasion/{slug}
 * - recipients → /gifts/recipient/{slug} or /gifts/{slug}
 * - collections → /gifts/luxury-collection, /gifts/corporate-gifting
 * - tags       → platform badges (admin-only); also used in AI scoring
 */

export const OCCASIONS = [
  { slug: "birthday", label: "Birthday" },
  { slug: "anniversary", label: "Anniversary" },
  { slug: "wedding", label: "Wedding" },
  { slug: "graduation", label: "Graduation" },
  { slug: "new-baby", label: "New Baby" },
  { slug: "thank-you", label: "Thank You" },
] as const;

export const RECIPIENTS = [
  { slug: "for-her", label: "For Her" },
  { slug: "for-him", label: "For Him" },
  { slug: "for-parents", label: "For Parents" },
  { slug: "for-friends", label: "For Friends" },
  { slug: "for-kids", label: "For Kids" },
  { slug: "corporate-gifts", label: "Corporate Gifts" },
] as const;

export const COLLECTIONS = [
  { slug: "luxury", label: "Luxury Collection", href: "/gifts/luxury-collection" },
  { slug: "corporate", label: "Corporate Gifting", href: "/gifts/corporate-gifting" },
] as const;

/** Kay-controlled badges — vendors cannot set these */
export const PLATFORM_TAGS = [
  { slug: "bestseller", label: "Bestseller" },
  { slug: "new", label: "New" },
  { slug: "exclusive", label: "Exclusive" },
  { slug: "night_collection", label: "Night Collection" },
] as const;

export type OccasionSlug = (typeof OCCASIONS)[number]["slug"];
export type RecipientSlug = (typeof RECIPIENTS)[number]["slug"];
export type CollectionSlug = (typeof COLLECTIONS)[number]["slug"];
export type PlatformTagSlug = (typeof PLATFORM_TAGS)[number]["slug"];

export const CATEGORY_SLUGS = RECIPIENTS.map((r) => r.slug);

const OCCASION_SET = new Set<string>(OCCASIONS.map((o) => o.slug));
const RECIPIENT_SET = new Set<string>(RECIPIENTS.map((r) => r.slug));
const COLLECTION_SET = new Set<string>(COLLECTIONS.map((c) => c.slug));
const PLATFORM_TAG_SET = new Set<string>(PLATFORM_TAGS.map((t) => t.slug));

export function isValidOccasion(slug: string): slug is OccasionSlug {
  return OCCASION_SET.has(slug);
}

export function isValidRecipient(slug: string): slug is RecipientSlug {
  return RECIPIENT_SET.has(slug);
}

export function isValidCollection(slug: string): slug is CollectionSlug {
  return COLLECTION_SET.has(slug);
}

export function isValidPlatformTag(slug: string): slug is PlatformTagSlug {
  return PLATFORM_TAG_SET.has(slug);
}

function dedupeValid(slugs: string[], isValid: (s: string) => boolean): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const slug of slugs) {
    const s = slug.trim();
    if (!s || !isValid(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function sanitizePlacementArrays(input: {
  occasions?: string[];
  recipients?: string[];
  collections?: string[];
}): {
  occasions: string[];
  recipients: string[];
  collections: string[];
} {
  return {
    occasions: dedupeValid(input.occasions ?? [], isValidOccasion),
    recipients: dedupeValid(input.recipients ?? [], isValidRecipient),
    collections: dedupeValid(input.collections ?? [], isValidCollection),
  };
}

export function sanitizePlatformTags(tags?: string[]): string[] {
  return dedupeValid(tags ?? [], isValidPlatformTag);
}

export function hasAnyPlacement(input: {
  occasions?: string[];
  recipients?: string[];
  collections?: string[];
}): boolean {
  const p = sanitizePlacementArrays(input);
  return (
    p.occasions.length > 0 ||
    p.recipients.length > 0 ||
    p.collections.length > 0
  );
}

export function getPlacementLabel(slug: string, kind: "occasion" | "recipient" | "collection"): string {
  if (kind === "occasion") {
    return OCCASIONS.find((o) => o.slug === slug)?.label ?? slug;
  }
  if (kind === "recipient") {
    return RECIPIENTS.find((r) => r.slug === slug)?.label ?? slug;
  }
  return COLLECTIONS.find((c) => c.slug === slug)?.label ?? slug;
}

export function formatPlacementSummary(product: {
  occasions: string[];
  recipients: string[];
  collections: string[];
}): string {
  const labels = [
    ...product.recipients.map((s) => getPlacementLabel(s, "recipient")),
    ...product.occasions.map((s) => getPlacementLabel(s, "occasion")),
    ...product.collections.map((s) => getPlacementLabel(s, "collection")),
  ];
  return labels.length > 0 ? labels.join(" · ") : "Not in any category yet";
}

export function getPlacementPreviewPaths(product: {
  occasions: string[];
  recipients: string[];
  collections: string[];
}): { label: string; href: string }[] {
  const paths: { label: string; href: string }[] = [];
  for (const slug of product.recipients) {
    const r = RECIPIENTS.find((x) => x.slug === slug);
    if (r) paths.push({ label: r.label, href: `/gifts/recipient/${slug}` });
  }
  for (const slug of product.occasions) {
    const o = OCCASIONS.find((x) => x.slug === slug);
    if (o) paths.push({ label: o.label, href: `/gifts/occasion/${slug}` });
  }
  for (const slug of product.collections) {
    const c = COLLECTIONS.find((x) => x.slug === slug);
    if (c) paths.push({ label: c.label, href: c.href });
  }
  return paths;
}
