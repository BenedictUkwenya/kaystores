"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ConciergeVendorAssignment } from "@/types/concierge";
import type { Vendor } from "@/types/dashboard";

type Props = {
  requestId: string;
  assignments: ConciergeVendorAssignment[];
  approvedVendors: Pick<Vendor, "id" | "businessName">[];
};

export function AdminConciergeDispatch({
  requestId,
  assignments,
  approvedVendors,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sendAll, setSendAll] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const assignedIds = new Set(assignments.map((a) => a.vendorId));
  const unassignedVendors = approvedVendors.filter((v) => !assignedIds.has(v.id));
  const responded = assignments.filter((a) => a.status !== "pending").length;

  function toggleVendor(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function dispatch() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/concierge/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          vendorIds: sendAll ? "all" : Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Dispatch failed");

      const parts: string[] = [];
      if (data.assigned > 0) parts.push(`Sent to ${data.assigned} vendor(s)`);
      if (data.skipped > 0) parts.push(`${data.skipped} already assigned`);
      setMessage(parts.join(". ") || "No new vendors to notify.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setLoading(false);
    }
  }

  if (!approvedVendors.length) {
    return (
      <p className="text-[12px] text-kay-muted">
        No approved vendors yet — approve vendors before dispatching.
      </p>
    );
  }

  return (
    <div className="space-y-3 border-t border-kay-border-light pt-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-kay-muted">
          Vendor sourcing
        </p>
        <p className="mt-1 text-[12px] text-kay-muted">
          {assignments.length === 0
            ? "Not sent to vendors yet."
            : `${assignments.length} vendor(s) notified · ${responded} responded`}
        </p>
      </div>

      {assignments.length > 0 && (
        <ul className="max-h-32 space-y-1 overflow-y-auto text-[12px] text-kay-muted">
          {assignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2">
              <span className="truncate">{a.vendorBusinessName ?? a.vendorId}</span>
              <span className="shrink-0 capitalize">{a.status.replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>
      )}

      {message && <p className="text-[12px] text-emerald-700">{message}</p>}

      {!open ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={unassignedVendors.length === 0 && assignments.length > 0}
          onClick={() => setOpen(true)}
          className="w-full"
        >
          {assignments.length === 0 ? "Send to vendors" : "Send to more vendors"}
        </Button>
      ) : (
        <div className="space-y-3 rounded-xl border border-kay-border-light bg-kay-surface p-3">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-kay-fg">
            <input
              type="radio"
              name={`dispatch-${requestId}`}
              checked={sendAll}
              onChange={() => setSendAll(true)}
            />
            All approved vendors ({approvedVendors.length})
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-kay-fg">
            <input
              type="radio"
              name={`dispatch-${requestId}`}
              checked={!sendAll}
              onChange={() => setSendAll(false)}
            />
            Selected vendors only
          </label>

          {!sendAll && (
            <ul className="max-h-36 space-y-2 overflow-y-auto pl-1">
              {unassignedVendors.map((v) => (
                <li key={v.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-kay-muted">
                    <input
                      type="checkbox"
                      checked={selected.has(v.id)}
                      onChange={() => toggleVendor(v.id)}
                    />
                    {v.businessName}
                  </label>
                </li>
              ))}
              {unassignedVendors.length === 0 && (
                <li className="text-[12px] text-kay-muted">All vendors already notified.</li>
              )}
            </ul>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="sm"
              disabled={loading || (!sendAll && selected.size === 0)}
              onClick={dispatch}
              className="flex-1"
            >
              {loading ? "Sending…" : "Confirm send"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
