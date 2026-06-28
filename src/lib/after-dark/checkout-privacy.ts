import type { CartItem } from "@/types/cart";
import type { OrderItem } from "@/types/order";

export const DISCREET_ITEM_LABEL = "Private catalogue selection";
export const DISCREET_BRAND_LABEL = "Kay Private";
export const DISCREET_ORDER_EYEBROW = "Private checkout";
export const DISCREET_SEGMENT_LABEL = "Private catalogue";
export const DISCREET_CONFIRMATION_EYEBROW = "Private order confirmed";

export function isAfterDarkPrivateCheckout(
  items: Pick<CartItem, "segment">[],
): boolean {
  return items.length > 0 && items.every((item) => item.segment === "after_dark");
}

export function hasAfterDarkItems(
  items: Pick<CartItem, "segment">[],
): boolean {
  return items.some((item) => item.segment === "after_dark");
}

export function isDiscreetOrder(
  items: Pick<OrderItem, "segment">[],
): boolean {
  return items.length > 0 && items.every((item) => item.segment === "after_dark");
}

export function discreetItemLabel(
  item: Pick<OrderItem, "name" | "segment">,
  index: number,
): string {
  if (item.segment !== "after_dark") return item.name;
  return `${DISCREET_ITEM_LABEL} ${index + 1}`;
}
