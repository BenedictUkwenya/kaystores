import type { Product } from "@/types/product";
import { getProducts } from "@/lib/products/queries";
import { findSimilarProducts } from "@/lib/ai/similarity";
import type { SuggestResult } from "@/lib/ai/suggest";

const RESULT_LIMIT = 5;

export async function suggestCompareProducts(
  anchor: Product,
): Promise<SuggestResult> {
  const { products: catalog } = await getProducts({ pageSize: 100 });
  const { products: picks, mode } = await findSimilarProducts(
    anchor,
    catalog,
    RESULT_LIMIT,
  );

  return {
    products: picks,
    message:
      picks.length > 0
        ? `Kay AI found ${picks.length} alternatives similar to ${anchor.name} — compare price, specs, and gifting fit.`
        : `No close alternatives found for ${anchor.name}. Try searching the catalog.`,
    mode,
  };
}
