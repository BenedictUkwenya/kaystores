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
  isGift?: boolean;
};

export function AdminOrderActions({
  orderId,
  paymentStatus,
  trackingNumber: initialTracking,
  trackingCarrier: initialCarrier,
  isGift = false,
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

      {isGift && (
        <div className="space-y-2 rounded-xl border border-kay-border-light bg-kay-surface p-3">
          <p className="text-[12px] font-medium text-kay-fg">Kay Reveal QR</p>
          <p className="text-[11px] leading-relaxed text-kay-muted">
            Download the packing sticker for the box. This locks further sender
            edits to the Reveal.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/admin/orders/${orderId}/reveal-qr?format=pdf`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-kay-fg px-3 text-[12px] font-medium text-kay-fg"
            >
              Download sticker PDF
            </a>
            <a
              href={`/api/admin/orders/${orderId}/reveal-qr?format=png`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-kay-border-light px-3 text-[12px] text-kay-fg"
            >
              Download QR PNG
            </a>
          </div>
        </div>
      )}

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
