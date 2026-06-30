import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/types/product";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 1536;

export function buildProductEmbeddingText(product: {
  name: string;
  brand: string;
  description: string;
  specs?: Record<string, string>;
  occasions?: string[];
  recipients?: string[];
  collections?: string[];
  tags?: string[];
}): string {
  const parts = [
    product.name,
    product.brand,
    product.description,
    product.occasions?.length ? `occasions: ${product.occasions.join(", ")}` : "",
    product.recipients?.length ? `recipients: ${product.recipients.join(", ")}` : "",
    product.collections?.length ? `collections: ${product.collections.join(", ")}` : "",
    product.tags?.length ? `tags: ${product.tags.join(", ")}` : "",
  ];
  if (product.specs && Object.keys(product.specs).length > 0) {
    parts.push(
      Object.entries(product.specs)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; "),
    );
  }
  return parts.filter(Boolean).join("\n").slice(0, 8000);
}

export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !text.trim()) return null;

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMS,
    }),
  });

  if (!res.ok) {
    console.error("[embeddings] OpenAI error:", await res.text());
    return null;
  }

  const data = (await res.json()) as {
    data?: { embedding?: number[] }[];
  };
  return data.data?.[0]?.embedding ?? null;
}

export async function upsertProductEmbedding(productId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: row, error } = await admin
    .from("products")
    .select(
      "id, name, brand, description, specs, occasions, recipients, collections, tags, status",
    )
    .eq("id", productId)
    .maybeSingle();

  if (error || !row || row.status !== "live") return;

  const text = buildProductEmbeddingText({
    name: String(row.name),
    brand: String(row.brand ?? ""),
    description: String(row.description ?? ""),
    specs: (row.specs as Record<string, string>) ?? {},
    occasions: (row.occasions as string[]) ?? [],
    recipients: (row.recipients as string[]) ?? [],
    collections: (row.collections as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
  });

  const embedding = await embedText(text);
  if (!embedding) return;

  await admin
    .from("products")
    .update({
      embedding,
      embedding_updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
}

export function scheduleProductEmbeddingRefresh(productId: string): void {
  void upsertProductEmbedding(productId).catch((err) => {
    console.error("[embeddings] refresh failed:", productId, err);
  });
}

export async function embedQueryText(query: string): Promise<number[] | null> {
  return embedText(query.trim());
}

export async function fetchVectorSimilarProductIds(
  anchorId: string,
  limit = 8,
): Promise<{ id: string; similarity: number }[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin.rpc("match_similar_products", {
    anchor_id: anchorId,
    match_count: limit,
  });

  if (error || !data) {
    if (error) console.error("[embeddings] match_similar_products:", error.message);
    return [];
  }

  return (data as { id: string; similarity: number }[]).map((row) => ({
    id: String(row.id),
    similarity: Number(row.similarity),
  }));
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin.from("products").select("*").in("id", ids);
  if (!data) return [];

  const { mapProductRow } = await import("@/types/product");
  const byId = new Map(data.map((row) => [String(row.id), mapProductRow(row)]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => p != null);
}
