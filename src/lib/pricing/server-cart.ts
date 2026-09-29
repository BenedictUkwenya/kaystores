import { createAdminClient } from "@/lib/supabase/admin";
import { mapProductRow } from "@/types/product";
import { applyClientMarkupToProduct, getMarkupTiers } from "@/lib/pricing/markup";
import { getProductSegment } from "@/lib/pricing/segment";
import { findVariationOption } from "@/lib/products/variations";
import type { CartItem } from "@/types/cart";

/**
 * Rebuild cart lines from the database so price, name, segment and vendor
 * can't be tampered with in the browser. Quantity and chosen variation are
 * the only client inputs kept.
 */
export async function repriceCartItems(
  items: CartItem[],
): Promise<{ ok: true; items: CartItem[] } | { ok: false; error: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: "Catalogue is unavailable." };

  const ids = [...new Set(items.map((i) => i.productId))];
  const { data, error } = await db.from("products").select("*").in("id", ids);
  if (error) return { ok: false, error: "Could not load products." };

  const tiers = await getMarkupTiers();
  const byId = new Map(
    (data ?? []).map((row) => {
      const product = applyClientMarkupToProduct(mapProductRow(row), tiers);
      return [product.id, product] as const;
    }),
  );

  const repriced: CartItem[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    const status = (product as { status?: string } | undefined)?.status;
    if (!product || (status && status !== "live")) {
      return { ok: false, error: `${item.name} is no longer available.` };
    }
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 50) {
      return { ok: false, error: "Invalid quantity in your bag." };
    }
    const option = findVariationOption(product.variation, item.variationOptionId);
    if (product.variation?.options.length && !option) {
      return { ok: false, error: `Choose an option for ${product.name}.` };
    }
    repriced.push({
      ...item,
      quantity,
      name: product.name,
      brand: product.brand,
      price: product.price,
      slug: product.slug,
      vendorId: product.vendor_id ?? null,
      segment: getProductSegment(product),
      ...(option
        ? {
            variationLabel: product.variation?.label,
            variationOptionId: option.id,
            variationOptionLabel: option.label,
            size: option.label,
          }
        : {}),
    });
  }
  return { ok: true, items: repriced };
}
