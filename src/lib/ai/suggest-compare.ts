import type { Product } from "@/types/product";
import { getProducts } from "@/lib/products/queries";
import type { SuggestResult } from "@/lib/ai/suggest";

const RESULT_LIMIT = 5;

function scoreCompareCandidate(anchor: Product, product: Product): number {
  let score = 0;

  for (const collection of anchor.collections) {
    if (product.collections.includes(collection)) score += 20;
  }

  for (const recipient of anchor.recipients) {
    if (product.recipients.includes(recipient)) score += 15;
  }

  for (const occasion of anchor.occasions) {
    if (product.occasions.includes(occasion)) score += 12;
  }

  if (product.brand === anchor.brand) score += 10;

  for (const tag of anchor.tags) {
    if (product.tags.includes(tag)) score += 5;
  }

  const priceDiff = Math.abs(product.price - anchor.price) / Math.max(anchor.price, 1);
  if (priceDiff <= 0.25) score += 20;
  else if (priceDiff <= 0.45) score += 10;
  else if (priceDiff > 0.8) score -= 8;

  if (!product.in_stock) score -= 100;

  return score;
}

export async function suggestCompareProducts(
  anchor: Product,
): Promise<SuggestResult> {
  const { products: catalog } = await getProducts({ pageSize: 100 });
  const candidates = catalog.filter(
    (product) => product.id !== anchor.id && product.in_stock,
  );

  const picks = candidates
    .map((product) => ({
      product,
      score: scoreCompareCandidate(anchor, product),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_LIMIT)
    .map((entry) => entry.product);

  return {
    products: picks,
    message:
      picks.length > 0
        ? `Kay AI found ${picks.length} alternatives similar to ${anchor.name} — compare price, specs, and gifting fit.`
        : `No close alternatives found for ${anchor.name}. Try searching the catalog.`,
    mode: "mock",
  };
}
