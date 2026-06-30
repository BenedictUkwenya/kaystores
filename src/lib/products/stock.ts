import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderItem } from "@/types/order";

export type StockLine = {
  productId: string;
  name: string;
  requested: number;
  available: number;
};

export async function reserveStockForOrder(
  items: Pick<OrderItem, "productId" | "quantity" | "name">[],
): Promise<{ ok: true } | { ok: false; error: string; line?: StockLine }> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Stock management is not configured." };
  }

  const payload = items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  const { error } = await admin.rpc("reserve_product_stock", {
    items: payload,
  });

  if (!error) return { ok: true };

  const msg = error.message ?? "";
  if (msg.startsWith("insufficient_stock:")) {
    const productId = msg.split(":")[1]?.trim();
    const line = items.find((i) => i.productId === productId) ?? items[0];
    const { data: product } = await admin
      .from("products")
      .select("stock_quantity, name")
      .eq("id", productId ?? line.productId)
      .maybeSingle();

    const available = Number(product?.stock_quantity ?? 0);
    const name = product?.name ?? line.name;
    if (available <= 0) {
      return {
        ok: false,
        error: `"${name}" is out of stock.`,
        line: { productId: line.productId, name, requested: line.quantity, available },
      };
    }
    return {
      ok: false,
      error: `Only ${available} left in stock for "${name}".`,
      line: { productId: line.productId, name, requested: line.quantity, available },
    };
  }

  return { ok: false, error: "Could not reserve stock. Please try again." };
}

export async function restoreStockForOrder(
  items: Pick<OrderItem, "productId" | "quantity">[],
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const payload = items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  await admin.rpc("restore_product_stock", { items: payload });
}
