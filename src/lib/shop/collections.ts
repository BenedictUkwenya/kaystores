import type { ProductFilters } from "@/types/product";
import {
  COLLECTIONS,
  OCCASIONS,
  RECIPIENTS,
  type OccasionSlug,
  type RecipientSlug,
} from "@/lib/shop/taxonomy";

export { OCCASIONS, RECIPIENTS, COLLECTIONS } from "@/lib/shop/taxonomy";

export type CollectionConfig = {
  slug: string;
  title: string;
  description: string;
  breadcrumbs: { label: string; href: string }[];
  filters: ProductFilters;
};

export const CATEGORY_SLUGS = RECIPIENTS.map((r) => r.slug);

export type CategorySlug = RecipientSlug;

const categoryMeta: Record<
  CategorySlug,
  { title: string; description: string }
> = {
  "for-her": {
    title: "For Her",
    description: "Thoughtfully curated luxury gifts she will treasure.",
  },
  "for-him": {
    title: "For Him",
    description: "Refined gifts for the discerning gentleman.",
  },
  "for-parents": {
    title: "For Parents",
    description: "Meaningful gifts to honour the ones who matter most.",
  },
  "for-friends": {
    title: "For Friends",
    description: "Celebrate friendship with gifts chosen with care.",
  },
  "for-kids": {
    title: "For Kids",
    description: "Heirloom-quality gifts for little ones.",
  },
  "corporate-gifts": {
    title: "Corporate Gifts",
    description: "Premium gifting for clients, teams, and partners.",
  },
};

export const MAIN_CATALOG: CollectionConfig = {
  slug: "gifts",
  title: "All Gifts",
  description:
    "Discover our full collection of luxury gifts, beautifully curated for every occasion.",
  breadcrumbs: [
    { label: "Home", href: "/" },
    { label: "Gifts", href: "/gifts" },
  ],
  filters: {},
};

export const COLLECTION_PAGES: Record<string, CollectionConfig> = {
  "luxury-collection": {
    slug: "luxury-collection",
    title: COLLECTIONS[0].label,
    description:
      "Our finest selection of premium gifts for those who appreciate the exceptional.",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Gifts", href: "/gifts" },
      { label: COLLECTIONS[0].label, href: COLLECTIONS[0].href },
    ],
    filters: { collections: ["luxury"] },
  },
  "corporate-gifting": {
    slug: "corporate-gifting",
    title: COLLECTIONS[1].label,
    description:
      "Elevate your client relationships with bespoke corporate gift solutions.",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Gifts", href: "/gifts" },
      { label: COLLECTIONS[1].label, href: COLLECTIONS[1].href },
    ],
    filters: { collections: ["corporate"] },
  },
};

export function getCategoryConfig(slug: string): CollectionConfig | null {
  if (!CATEGORY_SLUGS.includes(slug as CategorySlug)) return null;
  const meta = categoryMeta[slug as CategorySlug];
  return {
    slug,
    title: meta.title,
    description: meta.description,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Gifts", href: "/gifts" },
      { label: meta.title, href: `/gifts/${slug}` },
    ],
    filters: { recipients: [slug] },
  };
}

export function getOccasionConfig(slug: string): CollectionConfig | null {
  const occasion = OCCASIONS.find((o) => o.slug === slug);
  if (!occasion) return null;
  return {
    slug,
    title: occasion.label,
    description: `Luxury gifts perfect for ${occasion.label.toLowerCase()} celebrations.`,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Gifts", href: "/gifts" },
      { label: "By Occasion", href: "/gifts" },
      { label: occasion.label, href: `/gifts/occasion/${slug}` },
    ],
    filters: { occasions: [slug as OccasionSlug] },
  };
}

export function getRecipientConfig(slug: string): CollectionConfig | null {
  const recipient = RECIPIENTS.find((r) => r.slug === slug);
  if (!recipient) return null;
  return {
    slug,
    title: recipient.label,
    description: `Curated luxury gifts ${recipient.label.toLowerCase()}.`,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Gifts", href: "/gifts" },
      { label: "By Recipient", href: "/gifts" },
      { label: recipient.label, href: `/gifts/recipient/${slug}` },
    ],
    filters: { recipients: [slug as RecipientSlug] },
  };
}

export function getCollectionBySlug(slug: string): CollectionConfig | null {
  return COLLECTION_PAGES[slug] ?? getCategoryConfig(slug) ?? null;
}

export function getSearchConfig(query: string): CollectionConfig {
  return {
    slug: "search",
    title: query ? `Results for "${query}"` : "Search",
    description: query
      ? `Showing gifts matching your search.`
      : "Search our luxury gift collection.",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Search", href: "/search" },
    ],
    filters: { search: query },
  };
}

export const SHOP_CATEGORY_LINKS = RECIPIENTS.map((r) => ({
  label: r.label,
  href: `/gifts/${r.slug}`,
  slug: r.slug,
}));

export const NAV_DROPDOWN_LINKS = {
  Gifts: [{ label: "All Gifts", href: "/gifts" }, ...SHOP_CATEGORY_LINKS],
  "By Occasion": OCCASIONS.map((o) => ({
    label: o.label,
    href: `/gifts/occasion/${o.slug}`,
  })),
  "By Recipient": RECIPIENTS.map((r) => ({
    label: r.label,
    href: `/gifts/recipient/${r.slug}`,
  })),
} as const;

export const NAV_STATIC_LINKS = {
  "Luxury Collection": COLLECTIONS[0].href,
  "Corporate Gifting": COLLECTIONS[1].href,
} as const;
