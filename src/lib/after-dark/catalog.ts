import type { Product } from "@/types/product";

export const AFTER_DARK_AGE_KEY = "kay-after-dark-age-verified";

/** Products in the dedicated 18+ After Dark catalog. */
export function isAfterDarkCatalogProduct(
  product: Pick<Product, "collections">,
): boolean {
  return product.collections.includes("after-dark");
}

export const AFTER_DARK_ROUTES = {
  home: "/after-dark",
  shop: "/after-dark#selections",
  about: "/after-dark/about",
  contact: "/after-dark/contact",
  concierge: "/concierge",
} as const;

export const AFTER_DARK_NAV = [
  { label: "All Items", href: AFTER_DARK_ROUTES.shop },
  { label: "Collections", href: AFTER_DARK_ROUTES.shop },
  { label: "About Us", href: AFTER_DARK_ROUTES.about },
  { label: "Contact Us", href: AFTER_DARK_ROUTES.contact },
] as const;

export const AFTER_DARK_FOOTER_SHOP = {
  "All Items": AFTER_DARK_ROUTES.shop,
  Apparel: AFTER_DARK_ROUTES.shop,
  "Wellness & Intimacy": AFTER_DARK_ROUTES.shop,
  "Scents & Ambience": AFTER_DARK_ROUTES.shop,
} as const;

export const AFTER_DARK_FOOTER_ABOUT = {
  "Our Story": AFTER_DARK_ROUTES.about,
  Sustainability: "/sustainability",
  Careers: "/careers",
  Press: "/press",
} as const;

export const AFTER_DARK_COPY = {
  heroTitle: "The Intimate Edit",
  heroSubtitle:
    "A perfectly curated collection of perfumes, silks, and sensual gifts. Your discretion is guaranteed.",
  heroCta: "Enter the Dark",
  viewingLabel: "You're viewing Kay After Dark",
  featuredTitle: "Featured Selections",
  curatedTitle: "The Midnight Curated Box",
  curatedTitleEmphasis: "Midnight",
  curatedBody:
    "A quarterly surprise of 3–5 handpicked intimacy and wellness pieces — delivered in plain outer packaging with no Kay branding visible.",
  curatedPerks: [
    "3–5 handpicked items",
    "Fast discreet delivery",
    "Exclusive early pricing",
  ],
  curatedCta: "Join The Inner Circle",
  ageGateTitle: "Access Restricted",
  ageGateBody:
    "The content of Kay After Dark is for mature audiences only. Please confirm you are 18 years of age or older.",
  ageGateConfirm: "I am 18 or older",
  ageGateExit: "Exit Store",
} as const;
