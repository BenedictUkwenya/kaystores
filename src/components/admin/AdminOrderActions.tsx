"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  orderId: string;
  paymentStatus?: string;
  paymentReference?: string;
  orderStatus: string;
  allItemsQcPassed: boolean;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  isGift?: boolean;
};

export function AdminOrderActions({
  orderId,
  paymentStatus,
  paymentReference: existingReference,
  orderStatus,
  allItemsQcPassed,
  trackingNumber: initialTracking,
  trackingCarrier: initialCarrier,
  trackingUrl: initialUrl,
  isGift = false,
}: Props) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? "");
  const [trackingCarrier, setTrackingCarrier] = useState(initialCarrier ?? "");
  const [trackingUrl, setTrackingUrl] = useState(initialUrl ?? "");
  const [reference, setReference] = useState(
    existingReference && existingReference !== "manual-claim" ? existingReference : "",
  );
  const [refundReference, setRefundReference] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const paid = paymentStatus === "paid";
  const refunded = paymentStatus === "refunded";
  const cancelled = orderStatus === "cancelled";
  const delivered = orderStatus === "delivered";
  const shipped = orderStatus === "shipped";
  const canShip = paid && !cancelled && !delivered && !shipped && allItemsQcPassed;

  async function run(
    body: Record<string, unknown>,
    success: string,
    url = `/api/admin/orders/${orderId}`,
    method: "PATCH" | "POST" = "PATCH",
  ) {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setNotice(success);
      setShowCancel(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
        Admin actions
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
          {notice}
        </p>
      )}

      {isGift && !cancelled && (
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

      {!paid && !refunded && !cancelled && (
        <div className="space-y-3 rounded-xl border border-kay-border-light p-3">
          <p className="text-[12px] font-medium text-kay-fg">Confirm payment</p>
          <p className="text-[11px] leading-relaxed text-kay-muted">
            Only mark paid after you&apos;ve seen the money in the Kay account.
            This emails the customer and tells each vendor which hub to deliver to.
          </p>
          <Input
            label="Bank / Paystack reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={loading || !reference.trim()}
            className="w-full sm:w-auto"
            onClick={() =>
              run({ action: "mark_paid", reference: reference.trim() }, "Payment confirmed. Customer and vendors notified.")
            }
          >
            Mark payment received
          </Button>
        </div>
      )}

      {paid && !cancelled && !delivered && !shipped && !allItemsQcPassed && (
        <p className="rounded-xl border border-kay-border-light p-3 text-[11px] leading-relaxed text-kay-muted">
          Waiting on vendor items. Mark each one received at the hub and pass QC
          (left) before arranging outbound delivery.
        </p>
      )}

      {canShip && (
        <>
          <div className="rounded-xl border border-kay-gold/25 bg-kay-gold-light/30 p-3">
            <p className="text-[12px] font-medium text-kay-fg">Arrange outbound delivery</p>
            <p className="mt-1 text-[11px] leading-relaxed text-kay-muted">
              Book a Terminal pickup from the hub to the customer&apos;s address.
            </p>
            <Button
              type="button"
              size="sm"
              disabled={loading}
              className="mt-3 w-full sm:w-auto"
              onClick={() =>
                run({}, "Delivery booked. Customer emailed with tracking.", `/api/admin/orders/${orderId}/shipment`, "POST")
              }
            >
              Book Terminal delivery
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border border-kay-border-light p-3">
            <p className="text-[12px] font-medium text-kay-fg">Or ship manually</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Carrier / rider"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
              />
              <Input
                label="Tracking number (optional)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <Input
              label="Tracking link (optional, https)"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading || !trackingCarrier.trim()}
              className="w-full sm:w-auto"
              onClick={() =>
                run(
                  {
                    action: "ship",
                    trackingCarrier: trackingCarrier.trim(),
                    trackingNumber: trackingNumber.trim(),
                    trackingUrl: trackingUrl.trim(),
                  },
                  "Marked shipped. Customer emailed.",
                )
              }
            >
              Mark shipped
            </Button>
          </div>
        </>
      )}

      {shipped && (
        <div className="space-y-2 rounded-xl border border-kay-border-light p-3">
          <p className="text-[12px] font-medium text-kay-fg">Out for delivery</p>
          <p className="text-[11px] leading-relaxed text-kay-muted">
            Confirm once the customer has the package. This releases vendor
            earnings and emails the customer.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            className="w-full sm:w-auto"
            onClick={() => run({ action: "deliver" }, "Marked delivered.")}
          >
            Mark delivered
          </Button>
        </div>
      )}

      {cancelled && paid && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-[12px] font-medium text-kay-fg">Refund owed</p>
          <p className="text-[11px] leading-relaxed text-kay-muted">
            This order was cancelled after payment. Send the refund, then record it here.
          </p>
          <Input
            label="Refund reference"
            value={refundReference}
            onChange={(e) => setRefundReference(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={loading || !refundReference.trim()}
            className="w-full sm:w-auto"
            onClick={() =>
              run({ action: "mark_refunded", reference: refundReference.trim() }, "Refund recorded.")
            }
          >
            Mark refunded
          </Button>
        </div>
      )}

      {!cancelled && !delivered && (
        <div className="border-t border-kay-border-light pt-4">
          {showCancel ? (
            <div className="space-y-3">
              <label className="block text-[12px] font-medium text-kay-fg">
                Reason (sent to the customer)
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="mt-1 w-full rounded-lg border border-kay-border bg-kay-surface px-3 py-2 text-[13px]"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading || cancelReason.trim().length < 3}
                  onClick={() =>
                    run({ action: "cancel", reason: cancelReason.trim() }, "Order cancelled. Stock restored.")
                  }
                >
                  Confirm cancel
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowCancel(false)}>
                  Keep order
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="text-[12px] text-red-700 underline underline-offset-2"
            >
              Cancel order
            </button>
          )}
        </div>
      )}
    </div>
  );
}
