"use client";

import type { OrderPricing } from "@/lib/pricing/calculate";
import { PRICING_CONFIG, type CatalogSegment } from "@/lib/pricing/config";
import { formatNaira } from "@/lib/data/home";
import { DISCREET_SEGMENT_LABEL } from "@/lib/after-dark/checkout-privacy";

type OrderPricingBreakdownProps = {
  pricing: OrderPricing;
  compact?: boolean;
  /** Shorter summary for the cart drawer — items list stays visible above. */
  drawer?: boolean;
  discreet?: boolean;
};

export function OrderPricingBreakdown({
  pricing,
  compact = false,
  drawer = false,
  discreet = false,
}: OrderPricingBreakdownProps) {
  const {
    segments,
    productSubtotal,
    curationFeeTotal,
    deliveryFee,
    tax,
    grandTotal,
  } = pricing;

  const segmentLabel = (segment: CatalogSegment) =>
    discreet && segment === "after_dark"
      ? DISCREET_SEGMENT_LABEL
      : PRICING_CONFIG[segment].label;

  const showCuration = curationFeeTotal > 0;

  return (
    <div className={compact ? "space-y-2 text-[12px]" : "space-y-2.5 text-[13px]"}>
      {drawer ? (
        <>
          <div className="flex justify-between text-kay-muted">
            <span>Products</span>
            <span>{formatNaira(productSubtotal)}</span>
          </div>
          {showCuration && (
            <div className="flex justify-between text-kay-muted">
              <span>Curation</span>
              <span>{formatNaira(curationFeeTotal)}</span>
            </div>
          )}
        </>
      ) : (
        <>
          {segments.map((seg) => (
            <div key={seg.segment} className="space-y-1">
              {segments.length > 1 && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-kay-gold">
                  {segmentLabel(seg.segment)}
                </p>
              )}
              <div className="flex justify-between text-kay-muted">
                <span>Products</span>
                <span>{formatNaira(seg.productSubtotal)}</span>
              </div>
              {seg.curationFee > 0 && (
                <div className="flex justify-between text-kay-muted">
                  <span>Curation</span>
                  <span>{formatNaira(seg.curationFee)}</span>
                </div>
              )}
            </div>
          ))}

          {segments.length > 1 && showCuration && (
            <>
              <div className="border-t border-kay-border-light/60 pt-2" />
              <div className="flex justify-between font-medium text-kay-fg">
                <span>Products subtotal</span>
                <span>{formatNaira(productSubtotal)}</span>
              </div>
              <div className="flex justify-between font-medium text-kay-fg">
                <span>Curation total</span>
                <span>{formatNaira(curationFeeTotal)}</span>
              </div>
            </>
          )}
        </>
      )}

      <div className="flex justify-between text-kay-muted">
        <span>Delivery</span>
        {deliveryFee === 0 ? (
          <span className="font-medium text-emerald-600">Complimentary</span>
        ) : (
          <span>{formatNaira(deliveryFee)}</span>
        )}
      </div>
      {tax > 0 && (
        <div className="flex justify-between text-kay-muted">
          <span>Tax</span>
          <span>{formatNaira(tax)}</span>
        </div>
      )}

      <div
        className={`flex items-baseline justify-between border-t border-kay-border-light pt-3 ${
          compact ? "text-[14px]" : ""
        }`}
      >
        <span className="font-semibold text-kay-fg">Total</span>
        <span
          className={
            compact
              ? "font-bold text-kay-fg"
              : "text-[22px] font-bold text-kay-fg"
          }
        >
          {formatNaira(grandTotal)}
        </span>
      </div>
    </div>
  );
}
