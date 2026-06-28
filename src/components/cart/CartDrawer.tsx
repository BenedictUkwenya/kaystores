"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCart } from "@/providers/CartProvider";
import { useCompare } from "@/providers/CompareProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { calculateOrderPricing } from "@/lib/pricing/calculate";
import { OrderPricingBreakdown } from "@/components/pricing/OrderPricingBreakdown";
import { MovAlert } from "@/components/pricing/MovAlert";
import { IconBag, IconCompare, IconX } from "@/components/ui/Icons";

export function CartDrawer() {
  const { items, itemCount, isOpen, closeCart } = useCart();
  const pricing = useMemo(() => calculateOrderPricing(items), [items]);
  const { startCompareWithSlugs, closeCompare } = useCompare();

  function handleCompareBag() {
    const bagSlugs = [...new Set(items.map((item) => item.slug))];
    closeCart();
    startCompareWithSlugs(bagSlugs, bagSlugs[0]);
  }

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 bg-kay-fg/20 backdrop-blur-[2px]"
      />

      <aside className="cart-drawer absolute right-0 top-0 flex h-full max-h-[100dvh] w-full max-w-md flex-col bg-kay-bg shadow-2xl">
        <div className="shrink-0 border-b border-kay-border-light px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-[22px] text-kay-fg">Your Bag</h2>
              <p className="mt-0.5 text-[12px] text-kay-subtle">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full text-kay-fg transition-colors hover:bg-kay-surface"
            >
              <IconX />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kay-surface text-kay-muted">
              <IconBag className="h-7 w-7" />
            </div>
            <p className="mt-4 font-serif text-xl text-kay-fg">Your bag is empty</p>
            <p className="mt-2 max-w-xs text-[13px] text-kay-muted">
              Discover thoughtfully curated luxury gifts for every occasion.
            </p>
            <Link
              href="/gifts"
              onClick={closeCart}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
            >
              Browse Gifts
            </Link>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <ul className="px-5 sm:px-6">
                {items.map((item) => (
                  <CartLineItem key={item.productId} item={item} />
                ))}
              </ul>
            </div>

            <div className="cart-drawer-footer shrink-0 border-t border-kay-border-light bg-kay-bg px-5 py-4 sm:px-6">
              <OrderPricingBreakdown pricing={pricing} compact drawer />
              <div className="mt-3">
                <MovAlert pricing={pricing} />
              </div>
              <Link
                href={pricing.canCheckout ? "/checkout" : "#"}
                onClick={(e) => {
                  if (!pricing.canCheckout) e.preventDefault();
                  else closeCart();
                }}
                aria-disabled={!pricing.canCheckout}
                className={`mt-4 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-medium transition-opacity ${
                  pricing.canCheckout
                    ? "bg-kay-accent text-kay-accent-fg hover:opacity-90"
                    : "cursor-not-allowed bg-kay-surface text-kay-subtle"
                }`}
              >
                {pricing.canCheckout ? "Proceed to Checkout" : "Minimum order not met"}
              </Link>
              <button
                type="button"
                onClick={handleCompareBag}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-kay-border text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
              >
                <IconCompare className="h-4 w-4" />
                Compare items in bag
              </button>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 w-full py-2 text-center text-[13px] text-kay-muted transition-colors hover:text-kay-fg"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
