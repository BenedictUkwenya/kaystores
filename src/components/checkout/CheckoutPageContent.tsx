"use client";

import { useCart } from "@/providers/CartProvider";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { AfterDarkCheckoutHeader } from "@/components/checkout/AfterDarkCheckoutHeader";
import { isAfterDarkPrivateCheckout } from "@/lib/after-dark/checkout-privacy";

export function CheckoutPageContent() {
  const { items } = useCart();
  const isPrivate = isAfterDarkPrivateCheckout(items);

  return (
    <div
      className={`checkout-page w-full ${isPrivate ? "after-dark-private-checkout" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-14 lg:py-10">
        {isPrivate ? <AfterDarkCheckoutHeader /> : <CheckoutHeader />}
        <CheckoutForm isPrivateCheckout={isPrivate} />
      </div>
    </div>
  );
}
