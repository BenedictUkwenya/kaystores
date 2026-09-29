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
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [paidRef, setPaidRef] = useState("");
  const paid = request.paymentStatus === "paid";

  async function markPaid() {
    setLoading(true);
    setError("");
    setToast("");
    try {
      const res = await fetch("/api/admin/table", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, markPaid: true, paymentReference: paidRef }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not mark paid.");
      setPaidRef("");
      setToast("Marked paid — customer and baker emailed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark paid.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(next: TableRequestStatus) {
    const previous = status;
    setStatus(next);
    setStatusSaving(true);
    setError("");
    setToast("");
    try {
      const res = await fetch("/api/admin/table", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update status.");
      setToast(
        next === "submitted"
          ? `Status set to ${TABLE_STATUS_LABELS[next]}.`
          : `Status set to ${TABLE_STATUS_LABELS[next]} — customer emailed.`,
      );
      router.refresh();
    } catch (err) {
      setStatus(previous);
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function save() {
    setLoading(true);
    setError("");
    setToast("");
    try {
      const res = await fetch("/api/admin/table", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          assignedVendorId: vendorId || null,
          ...(paid
            ? {}
            : { quoteAmount: quoteAmount ? parseIntegerInput(quoteAmount) : null }),
          quoteNote: quoteNote.trim() || null,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update.");
      setNote("");
      setToast("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <li
      id={`request-${request.id}`}
      className="scroll-mt-24 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] target:ring-2 target:ring-kay-gold sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-serif text-[22px] text-kay-fg">
            {request.occasion || request.category}
          </p>
          <p className="text-[13px] text-kay-muted">
            {request.reference} · {TABLE_STATUS_LABELS[request.status]} ·{" "}
            {request.contactName}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                paid
                  ? "bg-emerald-100 text-emerald-800"
                  : request.paymentStatus === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-kay-surface text-kay-subtle"
              }`}
            >
              {paid ? "Paid" : request.paymentStatus === "pending" ? "Paying…" : "Unpaid"}
            </span>
          </p>
          <p className="mt-1 text-[12px] text-kay-subtle">
            {request.contactEmail}
            {request.contactPhone ? ` · ${request.contactPhone}` : ""}
            {" · "}
            {request.fulfillmentMethod === "pickup"
              ? `Pickup${request.pickupHubName ? ` @ ${request.pickupHubName}` : ""}`
              : `Kay delivery${
                  request.city
                    ? ` · ${request.city}${request.state ? `, ${request.state}` : ""}`
                    : ""
                }`}
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

      <div className="mt-4 space-y-1 text-[13px] text-kay-muted">
        {request.servings && <p>Servings: {request.servings}</p>}
        {request.flavourNotes && <p>Flavours: {request.flavourNotes}</p>}
        {request.styleNotes && <p>Style: {request.styleNotes}</p>}
        {request.messageOnItem && <p>Message on item: “{request.messageOnItem}”</p>}
        {request.allergies && (
          <p className="text-amber-800">Allergies / dietary: {request.allergies}</p>
        )}
        {request.neededBy && <p>Needed by: {request.neededBy}</p>}
        {request.budget != null && <p>Budget: ₦{request.budget.toLocaleString("en-NG")}</p>}
        {request.deliveryAddress && (
          <p>
            Deliver to: {request.recipientName ? `${request.recipientName}, ` : ""}
            {request.deliveryAddress}
            {request.recipientPhone ? ` · ${request.recipientPhone}` : ""}
          </p>
        )}
        {paid && request.paymentReference && (
          <p className="text-emerald-800">Payment ref: {request.paymentReference}</p>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-kay-subtle">
            Status {statusSaving ? "· saving…" : "· saves instantly"}
          </label>
          <select
            value={status}
            disabled={statusSaving}
            onChange={(e) => void changeStatus(e.target.value as TableRequestStatus)}
            className="h-10 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 text-[13px] disabled:opacity-60"
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
          label={paid ? "Quote (₦) · locked, paid" : "Quote (₦)"}
          value={quoteAmount}
          disabled={paid}
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
          label="Message to customer (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="We'll confirm flavours by Friday…"
        />
      </div>

      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      {toast && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {toast}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Button type="button" size="sm" disabled={loading} onClick={save}>
          {loading ? "Saving…" : "Save baker & quote"}
        </Button>
        {!paid && request.quoteAmount != null && request.quoteAmount > 0 && (
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="Bank transfer ref"
              value={paidRef}
              onChange={(e) => setPaidRef(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading || !paidRef.trim()}
              onClick={markPaid}
            >
              Mark paid
            </Button>
          </div>
        )}
      </div>

      {chatOpen && (
        <div className="mt-5">
          <TableRequestChat
            requestId={request.id}
            viewerRole="admin"
            hasAssignedVendor={Boolean(request.assignedVendorId)}
          />
        </div>
      )}
    </li>
  );
}
