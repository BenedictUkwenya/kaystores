import type { Product } from "@/types/product";

function extractNumber(value: string): number | null {
  const match = value.match(/[\d,.]+/);
  if (!match) return null;
  return Number.parseFloat(match[0].replace(/,/g, ""));
}

/** Lowest in-stock price wins; falls back to lowest overall. */
export function getBestValueSlug(products: Product[]): string | null {
  if (products.length === 0) return null;
  const inStock = products.filter((p) => p.in_stock);
  const pool = inStock.length > 0 ? inStock : products;
  const minPrice = Math.min(...pool.map((p) => p.price));
  return pool.find((p) => p.price === minPrice)?.slug ?? null;
}

export function getHighlightedSlugs(
  rowId: string,
  products: Product[],
  getValue: (product: Product) => string,
): Set<string> {
  if (products.length < 2) return new Set();

  if (rowId === "price") {
    const inStock = products.filter((p) => p.in_stock);
    const pool = inStock.length > 0 ? inStock : products;
    const min = Math.min(...pool.map((p) => p.price));
    return new Set(pool.filter((p) => p.price === min).map((p) => p.slug));
  }

  if (rowId === "availability") {
    return new Set(products.filter((p) => p.in_stock).map((p) => p.slug));
  }

  const scored = products.map((product) => ({
    slug: product.slug,
    num: extractNumber(getValue(product)),
  }));
  const nums = scored
    .map((entry) => entry.num)
    .filter((value): value is number => value != null);

  if (nums.length === 0) return new Set();

  const max = Math.max(...nums);
  return new Set(
    scored.filter((entry) => entry.num === max).map((entry) => entry.slug),
  );
}

export function mergeSpecKeys(products: Product[]) {
  const keys = new Set<string>();
  for (const product of products) {
    for (const key of Object.keys(product.specs)) keys.add(key);
  }
  return [...keys];
}
