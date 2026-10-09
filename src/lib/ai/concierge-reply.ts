import {
  GEMINI_CHAT_MODEL,
  geminiEndpoint,
  geminiHeaders,
  geminiKey,
} from "@/lib/ai/gemini";
import type { ShopperContext, VendorPlace } from "@/lib/ai/shopper";
import type { Product } from "@/types/product";

export type ConciergeReply = {
  message: string;
  productIds: string[];
};

function catalogLine(product: Product, vendor: VendorPlace | undefined): string {
  const where = vendor?.place ? `vendor in ${vendor.place}` : "vendor location unknown";
  const maker = vendor?.businessName ? `${vendor.businessName}, ${where}` : where;
  return [
    product.id,
    product.name,
    product.brand,
    `NGN ${product.price}`,
    product.product_type ?? "",
    product.recipients.slice(0, 3).join("/"),
    maker,
  ].join(" | ");
}

function shopperBrief(shopper: ShopperContext): string {
  if (!shopper.firstName && shopper.pastOrders.length === 0 && shopper.places.length === 0) {
    return "Shopper is not signed in. Do not invent a name, a past order, or a city.";
  }
  const orders = shopper.pastOrders
    .map((order) => {
      const where = order.place ? ` delivered around ${order.place}` : "";
      return `${order.items.join(", ")}${where}`;
    })
    .join("; ");
  return [
    shopper.firstName ? `First name: ${shopper.firstName}` : "Name unknown.",
    shopper.places.length ? `Places they have used: ${shopper.places.join("; ")}` : "",
    orders ? `Recent orders: ${orders}` : "No past orders.",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseReply(raw: string, allowed: Set<string>): ConciergeReply | null {
  const text = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(text) as { message?: string; productIds?: string[] };
    const message = parsed.message?.trim();
    const productIds = (parsed.productIds ?? []).filter((id) => allowed.has(id));
    if (!message || productIds.length === 0) return null;
    return { message: message.slice(0, 500), productIds: productIds.slice(0, 5) };
  } catch {
    return null;
  }
}

async function generate(apiKey: string, prompt: string): Promise<string | null> {
  const res = await fetch(geminiEndpoint(GEMINI_CHAT_MODEL, "generateContent"), {
    method: "POST",
    headers: geminiHeaders(apiKey),
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "You are Kay, the gift concierge at Kay Stores in Nigeria. Reply with JSON only.",
          },
        ],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") || null;
}

export async function writeConciergeReply(input: {
  query: string;
  afterDark: boolean;
  shopper: ShopperContext;
  products: Product[];
  vendors: Map<string, VendorPlace>;
}): Promise<ConciergeReply | null> {
  const apiKey = geminiKey();
  if (!apiKey || input.products.length === 0) return null;

  const allowed = new Set(input.products.map((product) => product.id));
  const prompt = `The shopper asked: ${input.query}
${input.afterDark ? "They are in After Dark. Prefer discreet, exclusive gifts from the list." : ""}

${shopperBrief(input.shopper)}

Catalogue (id | name | brand | price | type | who it suits | vendor):
${input.products.map((product) => catalogLine(product, input.vendors.get(product.vendor_id ?? ""))).join("\n")}

Choose 3 to 5 product ids from this list only. Stay inside any budget they named.
Write 2 or 3 sentences as Kay. Use their first name when you have it. Mention a past order or a vendor's city only when it actually helps this request. Do not invent places, orders, or products. Do not say demo mode.

Return JSON: {"message":"...","productIds":["id"]}`;

  let text = await generate(apiKey, prompt);
  if (!text) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    text = await generate(apiKey, prompt);
  }
  if (!text) return null;
  return parseReply(text, allowed);
}
