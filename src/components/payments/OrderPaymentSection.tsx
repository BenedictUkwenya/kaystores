"use client";

import { formatNaira } from "@/lib/data/home";
import { FlutterwavePayButton } from "@/components/payments/FlutterwavePayButton";
import type { Order } from "@/types/order";

type Props = {
  order: Order;
};

export function OrderPaymentSection({ order }: Props) {
  const unpaid =
    !order.paymentStatus || order.paymentStatus === "unpaid" || order.paymentStatus === "pending";
  const paid = order.paymentStatus === "paid";

  if (paid) return null;

  return (
    <div className="mt-6 rounded-xl border border-amber-200/70 bg-amber-50/60 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
        Payment required
      </p>
      <p className="mt-2 text-[14px] text-amber-950">
        Complete payment of{" "}
        <span className="font-semibold">{formatNaira(order.pricing.grandTotal)}</span>{" "}
        to confirm your order. Card and bank transfer are handled securely by Flutterwave.
      </p>
      {unpaid && (
        <FlutterwavePayButton
          kind="order"
          id={order.id}
          email={order.buyer.email}
          className="mt-4 w-full sm:w-auto"
        />
      )}
    </div>
  );
}
