"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { VendorOrderItem } from "@/types/dashboard";
import type { ShippingHub } from "@/types/shipping";

type Props = {
  item: VendorOrderItem;
  hubOptions: ShippingHub[];
};

function formatHubAddress(hub: Pick<ShippingHub, "address"> | { address: VendorOrderItem["selectedHubAddress"] }) {
  const a = hub.address;
  if (!a) return "";
  return [a.line1, a.city, a.state].filter(Boolean).join(", ");
}

export function VendorFulfillmentActions({ item, hubOptions }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(item.hubNotes ?? "");

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/orders/${item.id}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  if (item.fulfillmentStatus === "at_hub") {
    return (
      <p className="text-[12px] text-emerald-700">
        Dispatched to {item.selectedHubName ?? "hub"} — awaiting Kay QC
        {item.selectedHubPhone ? ` · ${item.selectedHubPhone}` : ""}
      </p>
    );
  }

  if (
    item.fulfillmentStatus !== "awaiting_hub_delivery" &&
    item.fulfillmentStatus !== "awaiting_payment"
  ) {
    return null;
  }

  const needsHubPick = !item.selectedHubId;

  return (
    <div className="space-y-3">
      {needsHubPick ? (
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-kay-fg">
            Choose the hub you will send to
          </p>
          <p className="text-[11px] leading-relaxed text-kay-muted">
            Pick one option near you. You will get a phone number to attach on
            the parcel so Kay is notified when it arrives.
          </p>
          {hubOptions.length === 0 ? (
            <p className="text-[12px] text-red-600">
              No hubs configured yet. Contact Kay support.
            </p>
          ) : (
            <ul className="space-y-2">
              {hubOptions.map((hub) => (
                <li key={hub.id}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => patch({ selectedHubId: hub.id, hubNotes: notes })}
                    className="w-full rounded-xl border border-kay-border-light bg-kay-surface px-3 py-3 text-left transition hover:border-kay-gold disabled:opacity-60"
                  >
                    <span className="block text-[13px] font-medium text-kay-fg">
                      {hub.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-kay-muted">
                      {formatHubAddress(hub)}
                    </span>
                    <span className="mt-1 block text-[12px] font-medium text-kay-fg">
                      Attach: {hub.contactPhone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-kay-gold/30 bg-kay-gold-light/20 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kay-gold">
            Send to this hub
          </p>
          <p className="mt-1 text-[13px] font-medium text-kay-fg">
            {item.selectedHubName}
          </p>
          {item.selectedHubAddress && (
            <p className="mt-0.5 text-[11px] text-kay-muted">
              {formatHubAddress({ address: item.selectedHubAddress })}
            </p>
          )}
          <p className="mt-2 text-[12px] text-kay-fg">
            Attach this number on the product before you send:
          </p>
          <p className="mt-1 font-mono text-[16px] font-semibold tracking-wide text-kay-fg">
            {item.selectedHubPhone}
          </p>
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Courier / delivery notes (optional)"
        className="w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 py-2 text-[13px]"
        rows={2}
      />

      {!needsHubPick && (
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() =>
            patch({ fulfillmentStatus: "at_hub", hubNotes: notes })
          }
          className="w-full sm:w-auto"
        >
          Mark as dispatched
        </Button>
      )}
    </div>
  );
}
