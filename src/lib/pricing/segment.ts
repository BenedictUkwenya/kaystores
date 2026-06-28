import type { Product } from "@/types/product";
import type { CatalogSegment } from "@/lib/pricing/config";

/** Products tagged for After Dark use intimacy pricing (40% curation, ₦20k MOV). */
export function getProductSegment(
  product: Pick<Product, "tags" | "collections">,
): CatalogSegment {
  if (
    product.tags.includes("night_collection") ||
    product.tags.includes("exclusive") ||
    product.collections.includes("after-dark")
  ) {
    return "after_dark";
  }
  return "gifting";
}

export function segmentLabel(segment: CatalogSegment): string {
  return segment === "after_dark" ? "After Dark" : "Gifting";
}
