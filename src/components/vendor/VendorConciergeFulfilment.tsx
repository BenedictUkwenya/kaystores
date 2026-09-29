"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { VendorConciergeItem } from "@/types/concierge";

type Props = {
  item: VendorConciergeItem;
  hub?: { name: string; address: string; phone: string } | null;
};

export function VendorConciergeFulfilment({ item, hub }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (item.outcome !== "selected") return null;

  const awaitingPayment = item.requestPaymentStatus !== "paid";

  async function update(status: "sourcing" | "at_hub") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/concierge/fulfilment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: item.assignmentId,
          fulfilmentStatus: status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-900">
        Fulfilment
      </p>
      {awaitingPayment ? (
        <p className="mt-2 text-[12px] text-emerald-900/80">
          Awaiting client payment. Don&apos;t buy or send anything until Kay confirms payment.
        </p>
      ) : (
        <>
          <p className="mt-1 text-[12px] text-emerald-900/80 capitalize">
            Status: {item.fulfilmentStatus.replace(/_/g, " ")}
          </p>
          {hub && item.fulfilmentStatus !== "at_hub" && (
            <div className="mt-2 rounded-lg bg-white/70 p-2.5 text-[12px] text-emerald-950">
              <p className="font-medium">Bring it to {hub.name}</p>
              <p className="mt-0.5 text-emerald-900/80">
                {hub.address}
                {hub.phone ? ` · ${hub.phone}` : ""}
              </p>
              <p className="mt-0.5 text-emerald-900/80">
                Label the parcel with {item.referenceNumber}. Kay delivers to the client after QC.
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2">
            {item.fulfilmentStatus === "pending" && (
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={() => update("sourcing")}
              >
                Start sourcing
              </Button>
            )}
            {(item.fulfilmentStatus === "pending" ||
              item.fulfilmentStatus === "sourcing") && (
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={() => update("at_hub")}
              >
                I&apos;ve sent it to the Kay hub
              </Button>
            )}
            {item.fulfilmentStatus === "at_hub" && (
              <p className="text-[12px] text-emerald-800">Sent to the hub — Kay will check it in and run QC.</p>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-[12px] text-red-700">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
