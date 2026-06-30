import { parsePrompt } from "@/lib/ai/parse-prompt";
import {
  COLLECTIONS,
  OCCASIONS,
  RECIPIENTS,
  sanitizePlacementArrays,
} from "@/lib/shop/taxonomy";

export type CategorySuggestInput = {
  name: string;
  description: string;
  brand?: string;
  price?: number;
  segment?: string;
};

export type CategorySuggestResult = {
  occasions: string[];
  recipients: string[];
  collections: string[];
  confidence: "low" | "medium" | "high";
  mode: "rules" | "llm";
};

function suggestByRules(input: CategorySuggestInput): CategorySuggestResult {
  const text = `${input.name} ${input.brand ?? ""} ${input.description}`.toLowerCase();
  const parsed = parsePrompt(text);

  const occasions = new Set(parsed.occasions);
  const recipients = new Set(parsed.recipients);
  const collections = new Set<string>();

  if (parsed.preferLuxury || (input.price ?? 0) >= 150_000) {
    collections.add("luxury");
  }
  if (parsed.preferCorporate) {
    collections.add("corporate");
    recipients.add("corporate-gifts");
  }

  if (/\b(baby|toddler|kid|child|children)\b/.test(text)) {
    recipients.add("for-kids");
    occasions.add("new-baby");
  }
  if (/\b(mum|mom|mother|wife|her|woman|women|skincare|perfume)\b/.test(text)) {
    recipients.add("for-her");
  }
  if (/\b(dad|father|him|man|men|husband|boyfriend)\b/.test(text)) {
    recipients.add("for-him");
  }
  if (/\b(friend|bestie)\b/.test(text)) {
    recipients.add("for-friends");
  }
  if (/\b(parent|parents|grandma|grandpa)\b/.test(text)) {
    recipients.add("for-parents");
  }
  if (/\b(hamper|premium|luxury|artisan|fine)\b/.test(text)) {
    collections.add("luxury");
  }

  const sanitized = sanitizePlacementArrays({
    occasions: [...occasions],
    recipients: [...recipients],
    collections: [...collections],
  });

  const total =
    sanitized.occasions.length +
    sanitized.recipients.length +
    sanitized.collections.length;

  return {
    ...sanitized,
    confidence: total >= 3 ? "high" : total >= 1 ? "medium" : "low",
    mode: "rules",
  };
}

async function suggestByLlm(
  input: CategorySuggestInput,
): Promise<CategorySuggestResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const prompt = `You classify luxury gift products for a Nigerian e-commerce shop.
Return ONLY valid JSON with keys occasions, recipients, collections (string arrays).
Use ONLY these slugs:
occasions: ${OCCASIONS.map((o) => o.slug).join(", ")}
recipients: ${RECIPIENTS.map((r) => r.slug).join(", ")}
collections: ${COLLECTIONS.map((c) => c.slug).join(", ")}

Product:
name: ${input.name}
brand: ${input.brand ?? ""}
price_ngn: ${input.price ?? 0}
description: ${input.description}

Pick all relevant categories (can be multiple).`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You output JSON only. Use slug values exactly as provided.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as {
      occasions?: string[];
      recipients?: string[];
      collections?: string[];
    };
    const sanitized = sanitizePlacementArrays(parsed);
    const total =
      sanitized.occasions.length +
      sanitized.recipients.length +
      sanitized.collections.length;
    if (total === 0) return null;
    return {
      ...sanitized,
      confidence: total >= 3 ? "high" : "medium",
      mode: "llm",
    };
  } catch {
    return null;
  }
}

export async function suggestProductCategories(
  input: CategorySuggestInput,
): Promise<CategorySuggestResult> {
  const llm = await suggestByLlm(input);
  if (llm) return llm;
  return suggestByRules(input);
}
