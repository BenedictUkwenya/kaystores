"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/data/home";
import { redirectToPaystackCheckout } from "@/components/payments/PaystackPayButton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StateSelect } from "@/components/ui/StateSelect";
import { normalizeNigerianPhone } from "@/lib/geo/nigeria";
import type { ClientConciergeDetail } from "@/types/concierge";

type Props = {
  detail: ClientConciergeDetail;
};

export function ConciergePaymentSection({ detail }: Props) {
  const [delivery, setDelivery] = useState({
    line1: "",
    city: "",
    state: "",
    recipientName: "",
    recipientPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!detail.canPay || !detail.paymentBreakdown) return null;

  const { clientPrice } = detail.paymentBreakdown;

  function patch(key: keyof typeof delivery, value: string) {
    setDelivery((prev) => ({ ...prev, [key]: value }));
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!delivery.line1.trim() || !delivery.city.trim() || !delivery.state) {
      setError("Add the delivery street, city and state.");
      return;
    }
    if (!delivery.recipientName.trim() || !normalizeNigerianPhone(delivery.recipientPhone)) {
      setError("Add the recipient's name and a valid Nigerian phone number.");
      return;
    }
    setLoading(true);
    try {
      await redirectToPaystackCheckout({ kind: "concierge", id: detail.id, delivery });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={pay}
      className="mt-6 space-y-4 rounded-xl border border-amber-200/70 bg-amber-50/60 p-5"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
          Complete payment
        </p>
        <p className="mt-2 text-[13px] text-amber-950">
          Tell us where to deliver, then pay to confirm. Sourcing begins after
          payment is received.
        </p>
        <p className="mt-4 font-serif text-[28px] text-amber-950">
          {formatNaira(clientPrice)}
        </p>
      </div>

      <Input
        label="Delivery address"
        value={delivery.line1}
        onChange={(e) => patch("line1", e.target.value)}
        placeholder="House number, street, landmark"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City / area"
          value={delivery.city}
          onChange={(e) => patch("city", e.target.value)}
          required
        />
        <StateSelect value={delivery.state} onChange={(s) => patch("state", s)} required />
        <Input
          label="Recipient name"
          value={delivery.recipientName}
          onChange={(e) => patch("recipientName", e.target.value)}
          required
        />
        <Input
          label="Recipient phone"
          type="tel"
          value={delivery.recipientPhone}
          onChange={(e) => patch("recipientPhone", e.target.value)}
          placeholder="0803 000 0000"
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-[12px] text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Redirecting to Paystack…" : `Pay ${formatNaira(clientPrice)}`}
      </Button>
    </form>
  );
}
