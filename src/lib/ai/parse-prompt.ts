export type ParsedPrompt = {
  keywords: string[];
  recipients: string[];
  occasions: string[];
  maxPrice: number | null;
  minPrice: number | null;
  preferLuxury: boolean;
  preferCorporate: boolean;
};

const RECIPIENT_KEYWORDS: Record<string, string[]> = {
  "for-him": [
    "boyfriend",
    "husband",
    "him",
    "his",
    "dad",
    "father",
    "brother",
    "gentleman",
    "man",
    "men",
    "boss",
  ],
  "for-her": [
    "girlfriend",
    "wife",
    "her",
    "sister",
    "mom",
    "mother",
    "woman",
    "women",
    "skincare",
    "she",
  ],
  "for-parents": ["parent", "parents", "mom", "mother", "dad", "father"],
  "for-friends": ["friend", "friends", "bestie", "colleague"],
  "for-kids": ["kid", "kids", "child", "children", "baby", "toddler"],
  "corporate-gifts": [
    "boss",
    "client",
    "corporate",
    "team",
    "employee",
    "colleague",
    "business",
  ],
};

const OCCASION_KEYWORDS: Record<string, string[]> = {
  birthday: ["birthday", "bday", "turning"],
  anniversary: ["anniversary"],
  wedding: ["wedding", "bride", "groom"],
  graduation: ["graduation", "graduate", "grad"],
  "new-baby": ["new mom", "new mum", "new baby", "baby shower", "newborn"],
  "thank-you": ["thank you", "thank-you", "appreciation", "gratitude"],
};

export function parsePrompt(query: string): ParsedPrompt {
  const lower = query.toLowerCase();
  const keywords = lower
    .split(/[\s,.]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);

  const recipients = new Set<string>();
  for (const [slug, terms] of Object.entries(RECIPIENT_KEYWORDS)) {
    if (terms.some((t) => lower.includes(t))) recipients.add(slug);
  }

  const occasions = new Set<string>();
  for (const [slug, terms] of Object.entries(OCCASION_KEYWORDS)) {
    if (terms.some((t) => lower.includes(t))) occasions.add(slug);
  }

  let maxPrice: number | null = null;
  let minPrice: number | null = null;

  const underMatch = lower.match(
    /under\s*₦?\s*([\d,]+)\s*(k|thousand|m|million)?/i,
  );
  if (underMatch) {
    let n = Number(underMatch[1].replace(/,/g, ""));
    const unit = underMatch[2]?.toLowerCase();
    if (unit === "k" || unit === "thousand") n *= 1000;
    if (unit === "m" || unit === "million") n *= 1_000_000;
    maxPrice = n;
  }

  const budgetMatch = lower.match(/₦?\s*([\d,]+)\s*(k|thousand)?/);
  if (!maxPrice && budgetMatch && lower.includes("budget")) {
    let n = Number(budgetMatch[1].replace(/,/g, ""));
    if (budgetMatch[2]) n *= 1000;
    maxPrice = n;
  }

  const preferLuxury =
    /\b(luxury|premium|exclusive|high-end|splurge|lavish)\b/.test(lower);
  const preferCorporate = /\b(corporate|client|team|business)\b/.test(lower);

  return {
    keywords,
    recipients: [...recipients],
    occasions: [...occasions],
    maxPrice,
    minPrice,
    preferLuxury,
    preferCorporate,
  };
}
