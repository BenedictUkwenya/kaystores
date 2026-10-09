import type { Product } from "@/types/product";
import { getProducts } from "@/lib/products/queries";
import { parsePrompt, type ParsedPrompt } from "@/lib/ai/parse-prompt";
import { writeChatReply, type ChatTurn } from "@/lib/ai/concierge-reply";
import { listActiveFeaturedProducts } from "@/lib/ai/featured";
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
  const reply = await writeChatReply({
    turns: [{ role: "user", text: trimmed }],
    afterDark,
    shopper,
    products: candidates,
    featuredIds: new Set(),
    vendors,
  });

  if (reply) {
    const byId = new Map(candidates.map((product) => [product.id, product]));
    const chosen = reply.productIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => product != null);
    if (reply.message && chosen.length > 0) {
      return { products: chosen, message: reply.message, mode };
    }
    if (reply.message && chosen.length === 0) {
      return { products: [], message: reply.message, mode: "metadata" };
    }
  }

  return {
    products: [],
    message: "Kay is busy right now. Send that again in a moment.",
    mode: picks.length > 0 ? mode : "metadata",
  };
}

export type KayReply = {
  message: string;
  products: Product[];
  featuredIds: string[];
  note: string | null;
  handoff: { href: string; label: string } | null;
  busy: boolean;
};

export async function replyToKay(
  turns: ChatTurn[],
  afterDark = false,
): Promise<KayReply> {
  const busy: KayReply = {
    message: "Kay is busy right now. Send that again in a moment.",
    products: [],
    featuredIds: [],
    note: null,
    handoff: null,
    busy: true,
  };
  const lastUser = [...turns].reverse().find((turn) => turn.role === "user");
  if (!lastUser?.text.trim()) {
    return { ...busy, message: "Tell me who the gift is for.", busy: false };
  }

  const parsed = parsePrompt(lastUser.text);
  const [{ products: catalog }, featuredProducts, shopper] = await Promise.all([
    getProducts({ pageSize: 80 }),
    listActiveFeaturedProducts(),
    loadShopperContext(),
  ]);
  const inStock = catalog.filter((product) => product.in_stock);
  const pool = new Map<string, Product>();
  for (const product of shortlistForModel(inStock, parsed, afterDark)) {
    pool.set(product.id, product);
  }
  for (const product of featuredProducts) pool.set(product.id, product);
  const products = [...pool.values()];
  const featuredIds = new Set(featuredProducts.map((product) => product.id));
  const vendors = await loadVendorPlaces(products.map((product) => product.vendor_id ?? ""));
  const reply = await writeChatReply({
    turns,
    afterDark,
    shopper,
    products,
    featuredIds,
    vendors,
  });
  if (!reply) return busy;

  const byId = new Map(products.map((product) => [product.id, product]));
  const chosen: Product[] = [];
  for (const id of reply.productIds) {
    const product = byId.get(id);
    if (product && !chosen.some((item) => item.id === product.id)) chosen.push(product);
  }
  if (reply.featuredId) {
    const featured = byId.get(reply.featuredId);
    if (featured && !chosen.some((item) => item.id === featured.id)) chosen.unshift(featured);
  }

  const handoff =
    reply.handoff === "kitchen"
      ? { href: "/table/request", label: "Start a Kay Kitchen request" }
      : reply.handoff === "concierge"
        ? { href: "/concierge", label: "Start a concierge request" }
        : null;

  return {
    message: reply.message,
    products: chosen.slice(0, 5),
    featuredIds: reply.featuredId ? [reply.featuredId] : [],
    note: reply.note,
    handoff,
    busy: false,
  };
}
