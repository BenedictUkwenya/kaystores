"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  orderId: string;
  itemId: string;
  status: string;
  orderPaid: boolean;
};

export function AdminItemHubActions({ orderId, itemId, status, orderPaid }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failing, setFailing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemId, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setFailing(false);
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (!orderPaid) return null;

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {status === "awaiting_hub_delivery" && (
          <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => run("hub_received")}>
            Received at hub
          </Button>
        )}
        {status === "at_hub" && (
          <>
            <Button type="button" size="sm" disabled={loading} onClick={() => run("qc_pass")}>
              QC pass
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => setFailing((v) => !v)}
            >
              QC fail
            </Button>
          </>
        )}
      </div>
      {failing && (
        <div className="w-full space-y-2 sm:w-64">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="What's wrong? The vendor sees this."
            className="w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 py-2 text-[12px] text-kay-fg outline-none focus:border-kay-fg"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || !note.trim()}
            onClick={() => run("qc_fail", { note })}
          >
            Send back to vendor
          </Button>
        </div>
      )}
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
