import type { Product } from "@/types/product";

export const TABLE_COLLECTION = "table" as const;

export const TABLE_CATEGORIES = [
  { slug: "cake", label: "Cakes", tag: "cake" },
  { slug: "chocolate", label: "Chocolates", tag: "chocolate" },
  { slug: "hamper", label: "Hampers", tag: "hamper" },
  { slug: "treat", label: "Treats", tag: "treat" },
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
  brand: "Kay Table",
  tagline: "Edible gifts, made to celebrate",
  heroTitle: "Kay Table",
  heroSubtitle:
    "Cakes, chocolates, and gourmet hampers — ready to gift, or crafted to your brief.",
  heroBrowse: "Browse the table",
  heroRequest: "Request a custom cake",
  featuredTitle: "On the table",
  categoriesTitle: "What are you craving?",
  requestTitle: "Tell us about your cake",
  requestSubtitle:
    "Share the occasion, flavours, and date — Kay matches you with a trusted baker.",
} as const;
