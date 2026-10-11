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

const MOV_GIFTING = testMode ? 0 : 20_000;
const MOV_AFTER_DARK = testMode ? 0 : 20_000;

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
    /** Door delivery in Abuja or Minna. */
    localDoor: 5_000,
    /** Door delivery everywhere else. */
    outsideDoor: 10_000,
  },
  taxRate: testMode ? 0 : 0.02,
} as const;
