/** Sale price + discount % → original "was" price for compare_at_price. */
export function compareAtPriceFromDiscount(
  salePrice: number,
  discountPercent: number,
): number | null {
  if (
    !Number.isFinite(salePrice) ||
    salePrice <= 0 ||
    !Number.isFinite(discountPercent) ||
    discountPercent <= 0 ||
    discountPercent >= 100
  ) {
    return null;
  }
  return Math.round(salePrice / (1 - discountPercent / 100));
}

/** Derive discount % from stored sale + compare prices (for edit form). */
export function discountPercentFromPrices(
  salePrice: number,
  compareAt: number | null,
): number {
  if (!compareAt || compareAt <= salePrice || salePrice <= 0) return 0;
  return Math.round((1 - salePrice / compareAt) * 100);
}
