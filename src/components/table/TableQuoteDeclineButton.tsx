"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TableQuoteDeclineButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decline() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/table/requests/${requestId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not decline the quote.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[var(--table-line)] px-6 text-[13px] font-medium text-[var(--table-ink)] transition-colors hover:border-[var(--table-ink)] sm:w-auto"
      >
        Decline
      </button>
    );
  }

  return (
    <div className="mt-4 w-full text-left">
      <label className="block text-[12px] text-[var(--table-muted)]">
        Tell us why (optional)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="e.g. Over budget, found another option…"
          className="mt-1 w-full rounded-xl border border-[var(--table-line)] bg-transparent px-3 py-2 text-[14px] text-[var(--table-ink)]"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={decline}
          className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--table-ink)] px-5 text-[13px] font-medium text-[var(--table-paper)] disabled:opacity-60"
        >
          {busy ? "Declining…" : "Confirm decline"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
          className="text-[13px] text-[var(--table-muted)] hover:text-[var(--table-ink)]"
        >
          Keep quote
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
