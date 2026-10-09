import { generateGeminiText } from "@/lib/ai/gemini";
import type { ShopperContext, VendorPlace } from "@/lib/ai/shopper";
import type { Product } from "@/types/product";

export type ChatTurn = { role: "user" | "kay"; text: string };

export type ChatReply = {
  message: string;
  productIds: string[];
  featuredId: string | null;
  note: string | null;
  handoff: "kitchen" | "concierge" | null;
};

function catalogLine(
  product: Product,
  vendor: VendorPlace | undefined,
  featured: boolean,
): string {
  const where = vendor?.place ? `vendor in ${vendor.place}` : "vendor location unknown";
  const maker = vendor?.businessName ? `${vendor.businessName}, ${where}` : where;
  return [
    product.id,
    featured ? "FEATURED" : "",
    product.name,
    product.brand,
    `NGN ${product.price}`,
    product.product_type ?? "",
    maker,
  ]
    .filter(Boolean)
    .join(" | ");
}

function shopperBrief(shopper: ShopperContext): string {
  if (!shopper.signedIn) {
    return "Shopper is not signed in. Do not invent a name, an order, or a city. If they ask where an order is, ask them to sign in.";
  }
  const orders = shopper.orders
    .map((order) => `${order.number} (${order.status}): ${order.items || "items"}`)
    .join("; ");
  return [
    shopper.firstName ? `First name: ${shopper.firstName}` : "Name unknown.",
    shopper.places.length ? `Places they have used: ${shopper.places.join("; ")}` : "",
    orders ? `Their orders: ${orders}` : "No past orders.",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseReply(raw: string, allowed: Set<string>, featured: Set<string>): ChatReply | null {
  const text = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(text) as {
      message?: string;
      productIds?: string[];
      featuredId?: string | null;
      note?: string | null;
      handoff?: string | null;
    };
    const message = parsed.message?.trim();
    if (!message) return null;
    const productIds = (parsed.productIds ?? [])
      .filter((id) => allowed.has(id))
      .slice(0, 5);
    const featuredId =
      parsed.featuredId && featured.has(parsed.featuredId) ? parsed.featuredId : null;
    const handoff =
      parsed.handoff === "kitchen" || parsed.handoff === "concierge"
        ? parsed.handoff
        : null;
    const note = parsed.note?.trim() ? parsed.note.trim().slice(0, 500) : null;
    return {
      message: message.slice(0, 700),
      productIds,
      featuredId,
      note,
      handoff,
    };
  } catch {
    return null;
  }
}

export async function writeChatReply(input: {
  turns: ChatTurn[];
  afterDark: boolean;
  shopper: ShopperContext;
  products: Product[];
  featuredIds: Set<string>;
  vendors: Map<string, VendorPlace>;
}): Promise<ChatReply | null> {
  if (input.turns.length === 0) return null;

  const allowed = new Set(input.products.map((product) => product.id));
  const transcript = input.turns
    .slice(-12)
    .map((turn) => `${turn.role === "kay" ? "Kay" : "Shopper"}: ${turn.text}`)
    .join("\n");

  const prompt = `${shopperBrief(input.shopper)}
${input.afterDark ? "They are in After Dark. Prefer discreet gifts when you recommend any." : ""}

Catalogue (id | name | brand | price | type | vendor). FEATURED means a vendor paid to be shown. Mention at most one featured product, and only when it fits. Put that id in featuredId.
${input.products
  .map((product) =>
    catalogLine(product, input.vendors.get(product.vendor_id ?? ""), input.featuredIds.has(product.id)),
  )
  .join("\n")}

Conversation:
${transcript}

You are Kay, the gift concierge at Kay Stores in Nigeria. Talk like a person. Use their name when you have it.
- A greeting gets a greeting and one question. productIds must be empty.
- Recommend 1 to 5 products only when they have told you who, the occasion, a budget, or an opinion about earlier ideas.
- Answer order questions only from the orders listed above.
- If they want a card message, write it in note and also show it in message.
- If they are comparing gifts, put those product ids in productIds and say how they differ.
- If nothing in the catalogue fits and they need a custom cake, set handoff to "kitchen". If they need something sourced that is not listed, set handoff to "concierge". Otherwise handoff is null.
- Do not invent orders, cities, or products.

Return JSON: {"message":"...","productIds":[],"featuredId":null,"note":null,"handoff":null}`;

  const raw = await generateGeminiText({
    system: "You are Kay at Kay Stores. Reply with JSON only.",
    prompt,
    temperature: 0.7,
    json: true,
  });
  if (!raw) return null;
  return parseReply(raw, allowed, input.featuredIds);
}
