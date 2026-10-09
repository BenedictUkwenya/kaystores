/** Google AI Studio. Chat is Gemini Flash; embeddings stay 1536 so they fit the product column. */
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";

/** Newest free-tier text models first. Skip a model on 404, 429, or 503. */
export const GEMINI_CHAT_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
] as const;

export const GEMINI_CHAT_MODEL = GEMINI_CHAT_MODELS[0];
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMS = 1536;

export function geminiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || null;
}

export function geminiHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-goog-api-key": apiKey,
  };
}

export function geminiEndpoint(model: string, action: "generateContent" | "embedContent"): string {
  return `${GEMINI_URL}/models/${model}:${action}`;
}

const SKIP_STATUS = new Set([404, 408, 429, 500, 502, 503]);

/** Try each chat model until one returns text. */
export async function generateGeminiText(input: {
  system: string;
  prompt: string;
  temperature?: number;
  json?: boolean;
}): Promise<string | null> {
  const apiKey = geminiKey();
  if (!apiKey) return null;

  for (const model of GEMINI_CHAT_MODELS) {
    try {
      const res = await fetch(geminiEndpoint(model, "generateContent"), {
        method: "POST",
        headers: geminiHeaders(apiKey),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: input.temperature ?? 0.6,
            ...(input.json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      });
      if (!res.ok) {
        if (SKIP_STATUS.has(res.status)) continue;
        return null;
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
}
