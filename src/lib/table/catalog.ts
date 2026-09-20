import type { Product } from "@/types/product";

export const TABLE_COLLECTION = "table" as const;

export const TABLE_CATEGORIES = [
  { slug: "cake", label: "Cakes", tag: "cake", blurb: "Celebration cakes" },
  { slug: "chocolate", label: "Chocolates", tag: "chocolate", blurb: "Boxes & bars" },
  { slug: "hamper", label: "Hampers", tag: "hamper", blurb: "Gourmet baskets" },
  { slug: "treat", label: "Treats", tag: "treat", blurb: "Sweet extras" },
] as const;

export type TableCategorySlug = (typeof TABLE_CATEGORIES)[number]["slug"];

export function isTableCatalogProduct(
  product: Pick<Product, "collections">,
): boolean {
  return product.collections.includes(TABLE_COLLECTION);
}

export const TABLE_ROUTES = {
  home: "/table",
  shop: "/table#selections",
  cakes: "/table?tag=cake",
  chocolates: "/table?tag=chocolate",
  hampers: "/table?tag=hamper",
  treats: "/table?tag=treat",
  request: "/table/request",
  requestStatus: (id: string) => `/table/request/${id}`,
  about: "/table/about",
  search: "/search?collection=table",
} as const;

export const TABLE_NAV = [
  { label: "Browse", href: TABLE_ROUTES.shop },
  { label: "Cakes", href: TABLE_ROUTES.cakes },
  { label: "Custom cake", href: TABLE_ROUTES.request },
  { label: "About", href: TABLE_ROUTES.about },
] as const;

export const TABLE_COPY = {
  brand: "Kay Kitchen",
  tagline: "Edible gifts for every celebration",
  heroTitle: "Kay Kitchen",
  heroSubtitle:
    "Cakes, chocolates, and gourmet hampers — ready to gift, or made to your brief.",
  heroBrowse: "Browse",
  heroRequest: "Request a custom cake",
  featuredTitle: "Selections",
  categoriesTitle: "Shop by craving",
  requestTitle: "Tell us about your cake",
  requestSubtitle:
    "Share the occasion, flavours, and date — Kay matches you with a trusted baker.",
} as const;
