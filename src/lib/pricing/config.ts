/** Kay Stores pricing — aligned with client proposal. */

export type CatalogSegment = "gifting" | "after_dark";

export const PRICING_CONFIG = {
  gifting: {
    label: "Luxury gifting",
    mov: 50_000,
    curationFeeRate: 0.3,
  },
  after_dark: {
    label: "Kay After Dark",
    mov: 20_000,
    curationFeeRate: 0.4,
  },
  delivery: {
    flatFee: 4_500,
    freeProductSubtotalAbove: 100_000,
  },
  taxRate: 0.075,
} as const;
