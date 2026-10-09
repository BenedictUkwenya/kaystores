/** Google AI Studio. Chat is Gemini Flash; embeddings stay 1536 so they fit the product column. */
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_CHAT_MODEL = "gemini-flash-latest";
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
