/** URL-safe product identifier, e.g. "Luxury Silk Scarf" → "luxury-silk-scarf" */
export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function suggestSlugAlternatives(base: string): string[] {
  const slug = slugifyProductName(base) || "product";
  const unique = new Set<string>();
  for (const candidate of [
    `${slug}-2`,
    `${slug}-gift`,
    `${slug}-${Date.now().toString(36).slice(-4)}`,
  ]) {
    if (candidate !== slug) unique.add(candidate);
  }
  return [...unique].slice(0, 3);
}
