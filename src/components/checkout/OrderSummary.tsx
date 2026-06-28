"use client";

import { useState } from "react";
import Image from "next/image";
import type { CartItem } from "@/types/cart";
import { formatNaira } from "@/lib/data/home";
import { SatisfactionBanner } from "@/components/checkout/SatisfactionBanner";

const FREE_SHIPPING_THRESHOLD = 100_000;
const TAX_RATE = 0.075;

type OrderSummaryProps = {
  items: CartItem[];
  subtotal: number;
};

export function OrderSummary({ items, subtotal }: OrderSummaryProps) {
  const [promo, setPromo] = useState("");
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : null;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + (shipping ?? 0) + tax;

  return (
    <div>
      <div className="checkout-card rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-6">
        <h2 className="text-[18px] font-semibold text-kay-fg">Order Summary</h2>

        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-3">
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-kay-surface">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-snug text-kay-fg">
                  {item.name}
                </p>
                <p className="mt-0.5 text-[12px] text-kay-muted">{item.brand}</p>
                <p className="mt-1 text-[12px] text-kay-subtle">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-[14px] font-medium text-kay-fg">
                {formatNaira(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2.5 border-t border-kay-border-light pt-4 text-[13px]">
          <div className="flex justify-between text-kay-muted">
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-kay-muted">
            <span>Shipping</span>
            {shipping === 0 ? (
              <span className="font-medium text-emerald-600">Free</span>
            ) : (
              <span className="text-kay-subtle">At dispatch</span>
            )}
          </div>
          <div className="flex justify-between text-kay-muted">
            <span>Estimated Tax</span>
            <span>{formatNaira(tax)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-kay-border-light pt-4">
          <span className="text-[15px] font-semibold text-kay-fg">Total</span>
          <span className="text-[22px] font-bold text-kay-fg">
            {formatNaira(total)}
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="Promo code"
            className="h-11 min-w-0 flex-1 rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-fg"
          />
          <button
            type="button"
            className="shrink-0 rounded-lg bg-kay-fg px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>

      <SatisfactionBanner />
    </div>
  );
}
