import type { Product } from "@/types/product";
import { getProducts } from "@/lib/products/queries";
import { parsePrompt, type ParsedPrompt } from "@/lib/ai/parse-prompt";
import { writeConciergeReply } from "@/lib/ai/concierge-reply";
import { loadShopperContext, loadVendorPlaces } from "@/lib/ai/shopper";
import { rankProductsForQuery } from "@/lib/ai/similarity";
import type { SimilarityMode } from "@/lib/ai/similarity";

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

function fallbackMessage(firstName: string | null, products: Product[]) {
  if (products.length === 0) {
    return "I couldn't find a perfect match yet — try describing the recipient, occasion, or budget.";
  }
  const greeting = firstName ? `${firstName}, these` : "These";
  return `${greeting} are the closest gifts I can offer for that brief right now.`;
}

function shortlistForModel(
  catalog: Product[],
  parsed: ParsedPrompt,
  afterDark: boolean,
): Product[] {
  const scored = catalog
    .map((product) => ({ product, score: scoreProduct(product, parsed, afterDark) }))
    .sort((a, b) => b.score - a.score);
  const picked = new Map<string, Product>();
  for (const row of scored.slice(0, 40)) picked.set(row.product.id, row.product);
  if (parsed.maxPrice != null) {
    for (const product of catalog) {
      if (picked.size >= 60) break;
      if (product.price <= parsed.maxPrice) picked.set(product.id, product);
    }
  }
  return [...picked.values()].slice(0, 60);
}

export type SuggestResult = {
  products: Product[];
  message: string;
  mode: SimilarityMode;
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
      mode: "metadata",
    };
  }

  const parsed = parsePrompt(trimmed);
  const { products: catalog } = await getProducts({ pageSize: 100 });
  const inStock = catalog.filter((p) => p.in_stock);

  const { products: ranked, mode } = await rankProductsForQuery(
    trimmed,
    inStock,
    (product) => scoreProduct(product, parsed, afterDark),
    RESULT_LIMIT,
  );

  let picks = ranked;
  if (picks.length === 0) {
    picks = inStock
      .map((product) => ({
        product,
        score: scoreProduct(product, parsed, afterDark),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, RESULT_LIMIT)
      .map((s) => s.product);
  }

  if (afterDark && picks.length > 0) {
    picks = [...picks].sort((a, b) => {
      const aNight =
        (a.tags.includes("exclusive") ? 2 : 0) +
        (a.tags.includes("night_collection") ? 1 : 0);
      const bNight =
        (b.tags.includes("exclusive") ? 2 : 0) +
        (b.tags.includes("night_collection") ? 1 : 0);
      return bNight - aNight;
    });
  }

  const shopper = await loadShopperContext();
  const candidates = shortlistForModel(inStock, parsed, afterDark);
  const vendors = await loadVendorPlaces(
    candidates.map((product) => product.vendor_id ?? ""),
  );
  const reply = await writeConciergeReply({
    query: trimmed,
    afterDark,
    shopper,
    products: candidates,
    vendors,
  });

  if (reply) {
    const byId = new Map(candidates.map((product) => [product.id, product]));
    const chosen = reply.productIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => product != null);
    if (chosen.length > 0) {
      return { products: chosen, message: reply.message, mode };
    }
  }

  return {
    products: picks,
    message: fallbackMessage(shopper.firstName, picks),
    mode: picks.length > 0 ? mode : "metadata",
  };
}
