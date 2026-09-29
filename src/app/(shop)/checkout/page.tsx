import type { Metadata } from "next";
import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent";
import { isPaystackConfigured } from "@/lib/payments/config";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutPageContent paystackEnabled={isPaystackConfigured()} />;
}
