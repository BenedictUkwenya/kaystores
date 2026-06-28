import type { CartItem } from "@/types/cart";
import { PRICING_CONFIG, type CatalogSegment } from "@/lib/pricing/config";

function naira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export type SegmentPricing = {
  segment: CatalogSegment;
  productSubtotal: number;
  curationFee: number;
  curationRate: number;
  mov: number;
  movMet: boolean;
  movShortfall: number;
};

export type OrderPricing = {
  segments: SegmentPricing[];
  productSubtotal: number;
  curationFeeTotal: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  movErrors: string[];
  canCheckout: boolean;
};

function segmentLineTotal(item: CartItem): number {
  return item.price * item.quantity;
}

export function calculateOrderPricing(items: CartItem[]): OrderPricing {
  const segmentTotals: Record<CatalogSegment, number> = {
    gifting: 0,
    after_dark: 0,
  };

  for (const item of items) {
    const segment = item.segment ?? "gifting";
    segmentTotals[segment] += segmentLineTotal(item);
  }

  const segments: SegmentPricing[] = (["gifting", "after_dark"] as const)
    .filter((segment) => segmentTotals[segment] > 0)
    .map((segment) => {
      const config = PRICING_CONFIG[segment];
      const productSubtotal = segmentTotals[segment];
      const curationFee = Math.round(productSubtotal * config.curationFeeRate);
      const movMet = productSubtotal >= config.mov;

      return {
        segment,
        productSubtotal,
        curationFee,
        curationRate: config.curationFeeRate,
        mov: config.mov,
        movMet,
        movShortfall: movMet ? 0 : config.mov - productSubtotal,
      };
    });

  const productSubtotal = segments.reduce((s, x) => s + x.productSubtotal, 0);
  const curationFeeTotal = segments.reduce((s, x) => s + x.curationFee, 0);

  const deliveryFee =
    productSubtotal >= PRICING_CONFIG.delivery.freeProductSubtotalAbove
      ? 0
      : PRICING_CONFIG.delivery.flatFee;

  const taxable = productSubtotal + curationFeeTotal;
  const tax = Math.round(taxable * PRICING_CONFIG.taxRate);
  const grandTotal = taxable + deliveryFee + tax;

  const movErrors = segments
    .filter((s) => !s.movMet)
    .map(
      (s) =>
        `${PRICING_CONFIG[s.segment].label}: add ${naira(s.movShortfall)} more to reach the ${naira(s.mov)} minimum.`,
    );

  return {
    segments,
    productSubtotal,
    curationFeeTotal,
    deliveryFee,
    tax,
    grandTotal,
    movErrors,
    canCheckout: items.length > 0 && movErrors.length === 0,
  };
}

export type OrderPricingPayload = Pick<
  OrderPricing,
  | "productSubtotal"
  | "curationFeeTotal"
  | "deliveryFee"
  | "tax"
  | "grandTotal"
> & {
  segments: Pick<
    SegmentPricing,
    "segment" | "productSubtotal" | "curationFee" | "curationRate"
  >[];
};

export function toPricingPayload(pricing: OrderPricing): OrderPricingPayload {
  return {
    productSubtotal: pricing.productSubtotal,
    curationFeeTotal: pricing.curationFeeTotal,
    deliveryFee: pricing.deliveryFee,
    tax: pricing.tax,
    grandTotal: pricing.grandTotal,
    segments: pricing.segments.map((s) => ({
      segment: s.segment,
      productSubtotal: s.productSubtotal,
      curationFee: s.curationFee,
      curationRate: s.curationRate,
    })),
  };
}
