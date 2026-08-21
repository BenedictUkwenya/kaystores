"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/data/home";
import type { Order } from "@/types/order";
import { PaystackPayButton } from "@/components/payments/PaystackPayButton";

type Props = {
  order: Order;
  paystackEnabled?: boolean;
};

/**
 * Unpaid orders: Paystack checkout when configured, else manual attest.
 */
export function OrderPaymentSection({
  order,
  paystackEnabled = false,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unpaid =
    !order.paymentStatus ||
    order.paymentStatus === "unpaid" ||
    order.paymentStatus === "pending";
  const paid = order.paymentStatus === "paid";

  if (paid) return null;

  async function confirmPaid() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm-paid`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not confirm payment.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (paystackEnabled) {
    return (
      <div className="mt-6 rounded-xl border border-kay-gold/40 bg-kay-gold-light/25 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kay-gold">
          Complete payment
        </p>
        <p className="mt-2 text-[14px] text-kay-fg">
          Total due:{" "}
          <span className="font-semibold">
            {formatNaira(order.pricing.grandTotal)}
          </span>
          . Pay securely with card, bank transfer, or USSD via Paystack.
        </p>
        {unpaid && (
          <PaystackPayButton
            kind="order"
            id={order.id}
            email={order.buyer.email}
            className="mt-4"
            label={`Pay ${formatNaira(order.pricing.grandTotal)}`}
          />
        )}
        {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-200/70 bg-amber-50/60 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
        Payment confirmation
      </p>
      <p className="mt-2 text-[14px] text-amber-950">
        Total due:{" "}
        <span className="font-semibold">{formatNaira(order.pricing.grandTotal)}</span>.
        Online card checkout is paused — if you have already paid Kay, confirm below.
      </p>
      {unpaid && (
        <button
          type="button"
          disabled={busy}
          onClick={confirmPaid}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-kay-fg px-5 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Yes, I have paid"}
        </button>
      )}
      {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
