"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { CartItem } from "@/types/cart";
import { calculateOrderPricing } from "@/lib/pricing/calculate";
import { formatNaira } from "@/lib/data/home";
import { OrderPricingBreakdown } from "@/components/pricing/OrderPricingBreakdown";
import { MovAlert } from "@/components/pricing/MovAlert";
import { AfterDarkSegmentBadge } from "@/components/after-dark/AfterDarkSegmentBadge";
import { SatisfactionBanner } from "@/components/checkout/SatisfactionBanner";
import { AfterDarkSatisfactionBanner } from "@/components/checkout/AfterDarkSatisfactionBanner";
import { IconLock } from "@/components/ui/Icons";
import {
  DISCREET_BRAND_LABEL,
  DISCREET_ITEM_LABEL,
} from "@/lib/after-dark/checkout-privacy";

type OrderSummaryProps = {
  items: CartItem[];
  isPrivateCheckout?: boolean;
};

export function OrderSummary({
  items,
  isPrivateCheckout = false,
}: OrderSummaryProps) {
  const [promo, setPromo] = useState("");
  const pricing = useMemo(() => calculateOrderPricing(items), [items]);

  return (
    <div>
      <div className="checkout-card rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-6">
        <h2 className="text-[18px] font-semibold text-kay-fg">
          {isPrivateCheckout ? "Private summary" : "Order Summary"}
        </h2>

        {isPrivateCheckout && (
          <p className="mt-2 flex items-center gap-2 text-[11px] text-kay-muted">
            <IconLock className="h-3 w-3 text-ad-amber" />
            Item titles hidden on screen &amp; in your confirmation email
          </p>
        )}

        <ul className="mt-5 space-y-4">
          {items.map((item, index) => (
            <li key={item.productId} className="flex gap-3">
              <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#1a1a1a]">
                {isPrivateCheckout ? (
                  <IconLock className="h-5 w-5 text-ad-amber/70" />
                ) : (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-medium leading-snug text-kay-fg">
                    {isPrivateCheckout
                      ? `${DISCREET_ITEM_LABEL} ${index + 1}`
                      : item.name}
                  </p>
                  {!isPrivateCheckout && item.segment === "after_dark" && (
                    <AfterDarkSegmentBadge className="text-[9px]" />
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-kay-muted">
                  {isPrivateCheckout ? DISCREET_BRAND_LABEL : item.brand}
                </p>
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

        <div className="mt-5 border-t border-kay-border-light pt-4">
          <OrderPricingBreakdown
            pricing={pricing}
            discreet={isPrivateCheckout}
          />
        </div>

        <div className="mt-5">
          <MovAlert pricing={pricing} discreet={isPrivateCheckout} />
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

      {isPrivateCheckout ? <AfterDarkSatisfactionBanner /> : <SatisfactionBanner />}
    </div>
  );
}
