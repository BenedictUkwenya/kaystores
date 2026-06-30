import type { Product } from "@/types/product";
import {
  fetchProductsByIds,
  fetchVectorSimilarProductIds,
} from "@/lib/ai/embeddings";

export type SimilarityMode = "metadata" | "hybrid";

export function scoreMetadataSimilarity(anchor: Product, product: Product): number {
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

  const priceDiff =
    Math.abs(product.price - anchor.price) / Math.max(anchor.price, 1);
  if (priceDiff <= 0.25) score += 20;
  else if (priceDiff <= 0.45) score += 10;
  else if (priceDiff > 0.8) score -= 8;

  if (!product.in_stock) score -= 100;

  return score;
}

function normalizeMetadataScore(score: number): number {
  return Math.max(0, Math.min(1, score / 80));
}

export async function findSimilarProducts(
  anchor: Product,
  catalog: Product[],
  limit = 5,
): Promise<{ products: Product[]; mode: SimilarityMode }> {
  const candidates = catalog.filter(
    (p) => p.id !== anchor.id && p.in_stock,
  );

  const vectorHits = await fetchVectorSimilarProductIds(anchor.id, limit + 4);
  const vectorById = new Map(
    vectorHits.map((h) => [h.id, Math.max(0, h.similarity)]),
  );

  const hasVectors = vectorHits.length > 0;
  const mode: SimilarityMode = hasVectors ? "hybrid" : "metadata";

  const scored = candidates.map((product) => {
    const metadataScore = normalizeMetadataScore(
      scoreMetadataSimilarity(anchor, product),
    );
    const vectorScore = vectorById.get(product.id) ?? 0;
    const finalScore = hasVectors
      ? vectorScore * 0.55 + metadataScore * 0.45
      : metadataScore;
    return { product, finalScore, vectorScore, metadataScore };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  const fromCatalog = scored.slice(0, limit).map((s) => s.product);
  if (fromCatalog.length >= limit || !hasVectors) {
    return { products: fromCatalog, mode };
  }

  const missingIds = vectorHits
    .map((h) => h.id)
    .filter((id) => !fromCatalog.some((p) => p.id === id));
  const extra = await fetchProductsByIds(missingIds);
  const merged = [...fromCatalog];
  for (const p of extra) {
    if (merged.length >= limit) break;
    if (!merged.some((m) => m.id === p.id)) merged.push(p);
  }

  return { products: merged.slice(0, limit), mode };
}

export async function rankProductsForQuery(
  query: string,
  catalog: Product[],
  parsedBoost: (product: Product) => number,
  limit = 5,
): Promise<{ products: Product[]; mode: SimilarityMode }> {
  const { embedQueryText } = await import("@/lib/ai/embeddings");
  const queryEmbedding = await embedQueryText(query);

  if (!queryEmbedding) {
    const scored = catalog
      .map((p) => ({ product: p, score: parsedBoost(p) }))
      .filter((x) => x.score > -50)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.product);
    return { products: scored, mode: "metadata" };
  }

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  if (!admin) {
    return {
      products: catalog.slice(0, limit),
      mode: "metadata",
    };
  }

  const { data, error } = await admin.rpc("match_products_by_embedding", {
    query_embedding: queryEmbedding,
    match_count: limit + 5,
  });

  if (error || !data?.length) {
    const scored = catalog
      .map((p) => ({ product: p, score: parsedBoost(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.product);
    return { products: scored, mode: "metadata" };
  }

  const ids = (data as { id: string }[]).map((r) => String(r.id));
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const ranked = ids.map((id) => byId.get(id)).filter((p): p is Product => !!p);
  return { products: ranked.slice(0, limit), mode: "hybrid" };
}
