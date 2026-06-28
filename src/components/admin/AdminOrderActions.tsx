"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  orderId: string;
  paymentStatus?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
};

export function AdminOrderActions({
  orderId,
  paymentStatus,
  trackingNumber: initialTracking,
  trackingCarrier: initialCarrier,
}: Props) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? "");
  const [trackingCarrier, setTrackingCarrier] = useState(initialCarrier ?? "");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(update: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
        Admin actions
      </p>

      {paymentStatus !== "paid" && (
        <div className="space-y-3">
          <Input
            label="Payment reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />
      <Button
        type="button"
        size="sm"
        disabled={loading}
        className="w-full sm:w-auto"
        onClick={() =>
          save({ paymentStatus: "paid", paymentReference })
        }
      >
            Mark payment paid
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Carrier"
          value={trackingCarrier}
          onChange={(e) => setTrackingCarrier(e.target.value)}
        />
        <Input
          label="Tracking number"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={loading}
        className="w-full sm:w-auto"
        onClick={() =>
          save({
            trackingCarrier,
            trackingNumber,
            status: "shipped",
          })
        }
      >
        Save tracking & mark shipped
      </Button>
    </div>
  );
}
