"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/client";
import { useCart } from "@/providers/CartProvider";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { AfterDarkCheckoutHeader } from "@/components/checkout/AfterDarkCheckoutHeader";
import { AfterDarkCheckoutAgeGate } from "@/components/checkout/AfterDarkCheckoutAgeGate";
import { isAfterDarkPrivateCheckout } from "@/lib/after-dark/checkout-privacy";

export function CheckoutPageContent({ paystackEnabled }: { paystackEnabled: boolean }) {
  const { items, itemCount, subtotal } = useCart();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || itemCount === 0) return;
    startedRef.current = true;
    track("checkout_started", { item_count: itemCount, subtotal });
  }, [itemCount, subtotal]);
  const isPrivate = isAfterDarkPrivateCheckout(items);

  return (
    <div
      className={`checkout-page w-full ${isPrivate ? "after-dark-private-checkout" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-14 lg:py-10">
        <AfterDarkCheckoutAgeGate>
          {isPrivate ? <AfterDarkCheckoutHeader /> : <CheckoutHeader />}
          <CheckoutForm isPrivateCheckout={isPrivate} paystackEnabled={paystackEnabled} />
        </AfterDarkCheckoutAgeGate>
      </div>
    </div>
  );
}
