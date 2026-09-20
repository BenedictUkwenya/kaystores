"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatIntegerInput, parseIntegerInput } from "@/lib/data/home";
import type { TableRequest, TableRequestStatus } from "@/types/table";
import { TABLE_STATUS_LABELS } from "@/components/table/TableRequestStatusTimeline";
import { TableRequestChat } from "@/components/table/TableRequestChat";

type VendorOption = { id: string; businessName: string };

const STATUS_OPTIONS: TableRequestStatus[] = [
  "submitted",
  "reviewing",
  "quoted",
  "accepted",
  "declined",
  "fulfilled",
];

export function AdminTableRequestCard({
  request,
  vendors,
}: {
  request: TableRequest;
  vendors: VendorOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [vendorId, setVendorId] = useState(request.assignedVendorId ?? "");
  const [quoteAmount, setQuoteAmount] = useState(
    request.quoteAmount != null ? String(request.quoteAmount) : "",
  );
  const [quoteNote, setQuoteNote] = useState(request.quoteNote ?? "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  async function save() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/table", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          status,
          assignedVendorId: vendorId || null,
          quoteAmount: quoteAmount
            ? parseIntegerInput(quoteAmount)
            : null,
          quoteNote: quoteNote.trim() || null,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update.");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-serif text-[22px] text-kay-fg">
            {request.occasion || request.category}
          </p>
          <p className="text-[13px] text-kay-muted">
            {request.reference} · {TABLE_STATUS_LABELS[request.status]} ·{" "}
            {request.contactName}
          </p>
          <p className="mt-1 text-[12px] text-kay-subtle">
            {request.contactEmail}
            {request.contactPhone ? ` · ${request.contactPhone}` : ""}
            {request.city ? ` · ${request.city}` : ""}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setChatOpen((o) => !o)}
        >
          {chatOpen ? "Hide chat" : "Chat"}
        </Button>
      </div>

      {(request.flavourNotes || request.styleNotes || request.servings) && (
        <div className="mt-4 space-y-1 text-[13px] text-kay-muted">
          {request.servings && <p>Servings: {request.servings}</p>}
          {request.flavourNotes && <p>Flavours: {request.flavourNotes}</p>}
          {request.styleNotes && <p>Style: {request.styleNotes}</p>}
          {request.neededBy && <p>Needed by: {request.neededBy}</p>}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-kay-subtle">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TableRequestStatus)}
            className="h-10 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 text-[13px]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {TABLE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-kay-subtle">
            Assign baker
          </label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="h-10 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 text-[13px]"
          >
            <option value="">Unassigned</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.businessName}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Quote (₦)"
          value={quoteAmount}
          onChange={(e) => setQuoteAmount(formatIntegerInput(e.target.value))}
        />
        <Input
          label="Quote note"
          value={quoteNote}
          onChange={(e) => setQuoteNote(e.target.value)}
        />
      </div>

      <div className="mt-3">
        <Input
          label="Message to thread (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="We'll confirm flavours by Friday…"
        />
      </div>

      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}

      <div className="mt-4">
        <Button type="button" size="sm" disabled={loading} onClick={save}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </div>

      {chatOpen && (
        <div className="mt-5">
          <TableRequestChat requestId={request.id} viewerRole="admin" />
        </div>
      )}
    </li>
  );
}
