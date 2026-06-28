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

  return (
    <div className={compact ? "space-y-2 text-[12px]" : "space-y-2.5 text-[13px]"}>
      {drawer ? (
        <>
          <div className="flex justify-between text-kay-muted">
            <span>Products</span>
            <span>{formatNaira(productSubtotal)}</span>
          </div>
          <div className="flex justify-between text-kay-muted">
            <span>
              Curation
              {segments.length > 1
                ? ` (${segments.map((s) => `${Math.round(s.curationRate * 100)}%`).join(" + ")})`
                : segments[0]
                  ? ` (${Math.round(segments[0].curationRate * 100)}%)`
                  : ""}
            </span>
            <span>{formatNaira(curationFeeTotal)}</span>
          </div>
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
              <div className="flex justify-between text-kay-muted">
                <span>Curation fee ({Math.round(seg.curationRate * 100)}%)</span>
                <span>{formatNaira(seg.curationFee)}</span>
              </div>
            </div>
          ))}

          {segments.length > 1 && !compact && (
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

          {segments.length > 1 && compact && !drawer && (
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
      <div className="flex justify-between text-kay-muted">
        <span>Estimated tax</span>
        <span>{formatNaira(tax)}</span>
      </div>

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

      {!compact && (
        <p className="text-[11px] leading-relaxed text-kay-subtle">
          Curation covers luxury packaging, hub vetting, and white-glove
          handling. MOV: {formatNaira(PRICING_CONFIG.gifting.mov)} gifting ·{" "}
          {formatNaira(PRICING_CONFIG.after_dark.mov)}{" "}
          {discreet ? DISCREET_SEGMENT_LABEL : "After Dark"}.
        </p>
      )}
    </div>
  );
}
