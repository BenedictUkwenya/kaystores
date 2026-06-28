import type { Product } from "@/types/product";
import { getProducts } from "@/lib/products/queries";
import { parsePrompt, type ParsedPrompt } from "@/lib/ai/parse-prompt";

const RESULT_LIMIT = 5;

function scoreProduct(
  product: Product,
  parsed: ParsedPrompt,
  afterDark: boolean,
): number {
  let score = 0;
  const text =
    `${product.name} ${product.brand} ${product.description}`.toLowerCase();

  for (const kw of parsed.keywords) {
    if (text.includes(kw)) score += 8;
  }

  for (const r of parsed.recipients) {
    if (product.recipients.includes(r)) score += 25;
  }

  for (const o of parsed.occasions) {
    if (product.occasions.includes(o)) score += 20;
  }

  if (parsed.maxPrice != null && product.price <= parsed.maxPrice) {
    score += 15;
  } else if (parsed.maxPrice != null && product.price > parsed.maxPrice) {
    score -= 30;
  }

  if (parsed.preferLuxury && product.collections.includes("luxury")) {
    score += 18;
  }

  if (
    parsed.preferCorporate &&
    product.collections.includes("corporate")
  ) {
    score += 22;
  }

  if (product.tags.includes("bestseller")) score += 6;
  if (product.tags.includes("new")) score += 4;

  if (afterDark) {
    if (product.tags.includes("exclusive")) score += 20;
    if (product.tags.includes("night_collection")) score += 15;
  }

  if (!product.in_stock) score -= 100;

  return score;
}

function buildMessage(query: string, products: Product[], afterDark: boolean) {
  if (products.length === 0) {
    return "I couldn't find a perfect match yet — try describing the recipient, occasion, or budget.";
  }

  const names = products.slice(0, 2).map((p) => p.name).join(" and ");
  const tone = afterDark
    ? "For an evening gift, I've leaned toward our more exclusive picks."
    : "Based on what you shared,";

  return `${tone} here are ${products.length} curated ideas — including ${names}.`;
}

export type SuggestResult = {
  products: Product[];
  message: string;
  mode: "mock";
};

export async function suggestProducts(
  query: string,
  afterDark = false,
): Promise<SuggestResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      products: [],
      message: "Tell us who the gift is for and we'll suggest something special.",
      mode: "mock",
    };
  }

  const parsed = parsePrompt(trimmed);
  const { products: catalog } = await getProducts({ pageSize: 100 });

  const scored = catalog
    .map((product) => ({
      product,
      score: scoreProduct(product, parsed, afterDark),
    }))
    .sort((a, b) => b.score - a.score);

  const withSignal = scored.filter((s) => s.score > 0);
  let picks =
    withSignal.length > 0
      ? withSignal.slice(0, RESULT_LIMIT).map((s) => s.product)
      : catalog
          .filter((p) => p.in_stock)
          .slice(0, RESULT_LIMIT);

  if (afterDark) {
    const nightBoost = [...picks].sort((a, b) => {
      const aNight =
        (a.tags.includes("exclusive") ? 2 : 0) +
        (a.tags.includes("night_collection") ? 1 : 0);
      const bNight =
        (b.tags.includes("exclusive") ? 2 : 0) +
        (b.tags.includes("night_collection") ? 1 : 0);
      return bNight - aNight;
    });
    picks = nightBoost;
  }

  return {
    products: picks,
    message: buildMessage(trimmed, picks, afterDark),
    mode: "mock",
  };
}
