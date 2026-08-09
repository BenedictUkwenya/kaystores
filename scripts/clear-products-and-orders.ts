/**
 * Wipe catalog + order commerce so active vendors can upload real products.
 * Keeps: vendors, profiles, auth users, pricing tiers, concierge.
 *
 * Usage: npx tsx scripts/clear-products-and-orders.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) process.env[key] = value;
  }
}

try {
  loadEnvLocal();
} catch (err) {
  console.error("Could not read .env.local:", err);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  Prefer: "count=exact",
};

const NIL = "00000000-0000-0000-0000-000000000000";

async function count(table: string): Promise<number> {
  const res = await fetch(
    `${url}/rest/v1/${table}?select=id&limit=0`,
    { headers: { ...headers, Prefer: "count=exact" } },
  );
  if (!res.ok) {
    throw new Error(`${table} count: ${res.status} ${await res.text()}`);
  }
  const range = res.headers.get("content-range");
  // content-range: 0-0/12 or */0
  const total = range?.split("/")[1];
  return total ? Number(total) : 0;
}

async function deleteAll(table: string): Promise<void> {
  const res = await fetch(`${url}/rest/v1/${table}?id=neq.${NIL}`, {
    method: "DELETE",
    headers: {
      ...headers,
      Prefer: "return=minimal",
    },
  });
  if (!res.ok) {
    throw new Error(`${table} delete: ${res.status} ${await res.text()}`);
  }
}

async function listVendors(): Promise<{ business_name: string; status: string }[]> {
  const res = await fetch(
    `${url}/rest/v1/vendors?select=business_name,status&order=business_name.asc`,
    { headers },
  );
  if (!res.ok) throw new Error(`vendors: ${res.status} ${await res.text()}`);
  return (await res.json()) as { business_name: string; status: string }[];
}

async function clearProductImages(): Promise<number> {
  let removed = 0;
  const queue = [""];

  while (queue.length) {
    const prefix = queue.pop()!;
    const listUrl = `${url}/storage/v1/object/list/product-images`;
    const res = await fetch(listUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prefix: prefix,
        limit: 1000,
        offset: 0,
      }),
    });
    if (!res.ok) {
      console.warn(`[storage] list ${prefix || "/"}: ${res.status} ${await res.text()}`);
      continue;
    }
    const items = (await res.json()) as {
      name: string;
      id: string | null;
      metadata?: unknown;
    }[];
    if (!items?.length) continue;

    const files: string[] = [];
    for (const item of items) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      // Folders have null id / no metadata size
      if (!item.id) {
        queue.push(path);
      } else {
        files.push(path);
      }
    }

    if (files.length) {
      const rm = await fetch(`${url}/storage/v1/object/product-images`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ prefixes: files }),
      });
      if (!rm.ok) {
        console.warn(`[storage] remove: ${rm.status} ${await rm.text()}`);
      } else {
        removed += files.length;
      }
    }
  }

  return removed;
}

async function main() {
  console.log("Project:", url);
  console.log("--- before ---");

  const before = {
    products: await count("products"),
    orders: await count("orders"),
    vendor_order_items: await count("vendor_order_items"),
    vendor_earnings: await count("vendor_earnings"),
    withdrawal_requests: await count("withdrawal_requests"),
    vendors: await count("vendors"),
  };
  console.log(before);

  const vendors = await listVendors();
  console.log(
    "Vendors kept:",
    vendors.map((v) => `${v.business_name} (${v.status})`).join(", ") ||
      "(none)",
  );

  console.log("Deleting vendor_earnings…");
  await deleteAll("vendor_earnings");
  console.log("Deleting vendor_order_items…");
  await deleteAll("vendor_order_items");
  console.log("Deleting withdrawal_requests…");
  await deleteAll("withdrawal_requests");
  console.log("Deleting orders…");
  await deleteAll("orders");
  console.log("Deleting products…");
  await deleteAll("products");

  console.log("Clearing product-images storage…");
  const imagesRemoved = await clearProductImages();
  console.log(`Removed ${imagesRemoved} storage object(s).`);

  console.log("--- after ---");
  const after = {
    products: await count("products"),
    orders: await count("orders"),
    vendor_order_items: await count("vendor_order_items"),
    vendor_earnings: await count("vendor_earnings"),
    withdrawal_requests: await count("withdrawal_requests"),
    vendors: await count("vendors"),
  };
  console.log(after);

  if (
    after.products !== 0 ||
    after.orders !== 0 ||
    after.vendor_order_items !== 0 ||
    after.vendor_earnings !== 0
  ) {
    console.error("Wipe incomplete — check RLS / FK constraints.");
    process.exit(1);
  }

  console.log("Done. Active vendors can upload products afresh.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
