"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/providers/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { formatNaira } from "@/lib/data/home";
import { IconBag, IconX } from "@/components/ui/Icons";

export function CartDrawer() {
  const { items, itemCount, subtotal, isOpen, closeCart } = useCart();

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
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 bg-kay-fg/20 backdrop-blur-[2px]"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-kay-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-kay-border-light px-5 py-4 sm:px-6">
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
            <ul className="flex-1 overflow-y-auto px-5 sm:px-6">
              {items.map((item) => (
                <CartLineItem key={item.productId} item={item} />
              ))}
            </ul>

            <div className="border-t border-kay-border-light px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-kay-muted">Subtotal</span>
                <span className="font-semibold text-kay-fg">
                  {formatNaira(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-kay-subtle">
                Shipping & taxes calculated at checkout
              </p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-kay-accent text-[14px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
              >
                Proceed to Checkout
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-3 w-full py-2 text-center text-[13px] text-kay-muted transition-colors hover:text-kay-fg"
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
