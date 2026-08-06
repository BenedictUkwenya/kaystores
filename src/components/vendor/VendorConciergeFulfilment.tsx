"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { VendorConciergeItem } from "@/types/concierge";

type Props = {
  item: VendorConciergeItem;
};

export function VendorConciergeFulfilment({ item }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (item.outcome !== "selected") return null;

  const awaitingPayment = item.requestPaymentStatus !== "paid";

  async function update(status: "sourcing" | "at_hub" | "completed") {
    setLoading(true);
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
      alert(err instanceof Error ? err.message : "Update failed");
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
          Awaiting client payment. Sourcing unlocks once Kay confirms payment.
        </p>
      ) : (
        <>
          <p className="mt-1 text-[12px] text-emerald-900/80 capitalize">
            Status: {item.fulfilmentStatus.replace(/_/g, " ")}
          </p>
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
                Mark delivered to Kay hub
              </Button>
            )}
            {item.fulfilmentStatus === "at_hub" && (
              <p className="text-[12px] text-emerald-800">At hub — awaiting Kay QC</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
