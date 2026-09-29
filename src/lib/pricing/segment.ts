import type { Product } from "@/types/product";
import type { CatalogSegment } from "@/lib/pricing/config";

type SegmentSource = Pick<Product, "tags" | "collections"> & {
  segment?: string | null;
};

export function isCatalogSegment(value: unknown): value is CatalogSegment {
  return value === "gifting" || value === "after_dark";
}

/**
 * `products.segment` is the source of truth. Legacy tags/collections are only
 * consulted for rows (or fallback seed data) that have no segment set.
 * `exclusive` is a general badge and never implies After Dark.
 */
export function getProductSegment(product: SegmentSource): CatalogSegment {
  if (isCatalogSegment(product.segment)) return product.segment;
  if (
    product.tags.includes("night_collection") ||
    product.collections.includes("after-dark")
  ) {
    return "after_dark";
  }
  return "gifting";
}

export function isAfterDarkProduct(product: SegmentSource): boolean {
  return getProductSegment(product) === "after_dark";
}

export function segmentLabel(segment: CatalogSegment): string {
  return segment === "after_dark" ? "After Dark" : "Gifting";
}
