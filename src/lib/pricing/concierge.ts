import { applyClientMarkup } from "@/lib/pricing/markup";

export type ConciergePaymentBreakdown = {
  /** Single client-facing price (vendor quote + 15% markup). */
  clientPrice: number;
};

export function calculateConciergeClientPrice(vendorQuote: number): ConciergePaymentBreakdown {
  return {
    clientPrice: applyClientMarkup(vendorQuote),
  };
}
