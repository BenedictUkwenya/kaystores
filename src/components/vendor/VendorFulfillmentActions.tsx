"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { VendorOrderItem } from "@/types/dashboard";

type Props = {
  item: VendorOrderItem;
};

export function VendorFulfillmentActions({ item }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(item.hubNotes ?? "");

  async function update(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/orders/${item.id}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: status, hubNotes: notes }),
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

  if (item.paymentStatus === "unpaid") {
    return (
      <p className="text-[12px] text-kay-muted">
        Awaiting customer payment confirmation from Kay.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Hub delivery notes (optional)"
        className="w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 py-2 text-[13px]"
        rows={2}
      />
      {item.fulfillmentStatus === "awaiting_hub_delivery" && (
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => update("at_hub")}
          className="w-full sm:w-auto"
        >
          Mark delivered to hub
        </Button>
      )}
      {item.fulfillmentStatus === "at_hub" && (
        <p className="text-[12px] text-emerald-700">At hub — awaiting Kay QC</p>
      )}
    </div>
  );
}
