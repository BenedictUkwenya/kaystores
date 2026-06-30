import { createClient } from "@/lib/supabase/server";
import { slugifyProductName, suggestSlugAlternatives } from "@/lib/products/slug";

export type SlugAvailability = {
  available: boolean;
  slug: string;
  suggestions: string[];
};

export async function checkProductSlugAvailability(
  rawSlug: string,
  excludeProductId?: string,
): Promise<SlugAvailability> {
  const slug = slugifyProductName(rawSlug);
  if (!slug) {
    return { available: false, slug, suggestions: suggestSlugAlternatives("product") };
  }

  const supabase = await createClient();
  let query = supabase.from("products").select("id").eq("slug", slug).limit(1);
  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }
  const { data } = await query.maybeSingle();

  return {
    available: !data,
    slug,
    suggestions: data ? suggestSlugAlternatives(slug) : [],
  };
}

export function isDuplicateSlugError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("products_slug") ||
    lower.includes("duplicate key") && lower.includes("slug")
  );
}

export function formatDuplicateSlugError(slug: string): string {
  const suggestions = suggestSlugAlternatives(slug);
  return `This product link is already taken. Try: ${suggestions.join(", ")}`;
}
