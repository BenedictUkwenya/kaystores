import { markupPrice } from "@/lib/pricing/markup";

export type ConciergePaymentBreakdown = {
  /** Single client-facing price (vendor quote + Kay markup tiers). */
  clientPrice: number;
};

export async function calculateConciergeClientPrice(
  vendorQuote: number,
): Promise<ConciergePaymentBreakdown> {
  return {
    clientPrice: await markupPrice(vendorQuote),
  };
}
