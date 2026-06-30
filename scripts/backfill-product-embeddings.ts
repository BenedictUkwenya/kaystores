/**
 * Backfill embeddings for all live products.
 * Usage: npx tsx scripts/backfill-product-embeddings.ts
 * Requires OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local optional if vars already in environment
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!url || !serviceKey || !openaiKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function buildText(row: Record<string, unknown>): string {
  return [
    row.name,
    row.brand,
    row.description,
    Array.isArray(row.occasions) ? `occasions: ${(row.occasions as string[]).join(", ")}` : "",
    Array.isArray(row.recipients) ? `recipients: ${(row.recipients as string[]).join(", ")}` : "",
    Array.isArray(row.collections) ? `collections: ${(row.collections as string[]).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

async function main() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, brand, description, occasions, recipients, collections")
    .eq("status", "live");

  if (error) throw error;
  console.log(`Embedding ${products?.length ?? 0} live products…`);

  for (const row of products ?? []) {
    const text = buildText(row);
    const embedding = await embed(text);
    const { error: upErr } = await supabase
      .from("products")
      .update({
        embedding,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (upErr) console.error(row.id, upErr.message);
    else console.log("OK", row.name);
    await new Promise((r) => setTimeout(r, 200));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
