import type { CartItem } from "@/types/cart";
import type { OrderPricingPayload } from "@/lib/pricing/calculate";
import { calculateOrderPricing } from "@/lib/pricing/calculate";

export function validateOrderPricing(
  items: CartItem[],
  payload: OrderPricingPayload,
  deliveryFee?: number,
): { ok: true } | { ok: false; error: string } {
  const computed = calculateOrderPricing(items, deliveryFee);

  if (!computed.canCheckout) {
    return {
      ok: false,
      error: computed.movErrors[0] ?? "Minimum order value not met.",
    };
  }

  const expected = {
    productSubtotal: computed.productSubtotal,
    curationFeeTotal: computed.curationFeeTotal,
    deliveryFee: computed.deliveryFee,
    tax: computed.tax,
    grandTotal: computed.grandTotal,
  };

  for (const [key, value] of Object.entries(expected)) {
    if (payload[key as keyof typeof expected] !== value) {
      return {
        ok: false,
        error: "Order totals are out of date. Please refresh and try again.",
      };
    }
  }

  return { ok: true };
}
