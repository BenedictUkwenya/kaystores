/** Kay Stores pricing — aligned with client proposal. */

export type CatalogSegment = "gifting" | "after_dark";

/**
 * Local Paystack testing: set NEXT_PUBLIC_KAY_TEST_CHECKOUT=1 in .env.local
 * to drop MOV so a low-price test item can check out.
 * Turn off before production.
 */
export function isTestCheckoutMode(): boolean {
  return process.env.NEXT_PUBLIC_KAY_TEST_CHECKOUT === "1";
}

const testMode = isTestCheckoutMode();

/** Temporary QA — restore 20_000 before public launch. */
const MOV_GIFTING = 0;
const MOV_AFTER_DARK = 0;

export const PRICING_CONFIG = {
  gifting: {
    label: "Luxury gifting",
    mov: MOV_GIFTING,
    /** Curation fee retired — product price is the listed price. */
    curationFeeRate: 0,
  },
  after_dark: {
    label: "Kay After Dark",
    mov: MOV_AFTER_DARK,
    curationFeeRate: 0,
  },
  delivery: {
    /** Fallback when no live shipping quote is selected yet. */
    flatFee: testMode ? 0 : 4_500,
  },
  taxRate: testMode ? 0 : 0.075,
} as const;
