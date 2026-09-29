"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/data/home";

type Props = {
  requestId: string;
  currentAmount?: number | null;
  currentNote?: string | null;
  quotedAt?: string | null;
  /** False once Kay has sent the client a quote or the request is closed. */
  editable: boolean;
};

export function VendorTableQuoteForm({
  requestId,
  currentAmount,
  currentNote,
  quotedAt,
  editable,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(currentAmount ? String(currentAmount) : "");
  const [note, setNote] = useState(currentNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/vendor/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, amount: Number(amount), note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not send your price.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!editable) {
    return currentAmount ? (
      <div className="mt-4 rounded-xl border border-kay-border-light bg-kay-surface p-3 text-[13px]">
        <p className="text-[10px] uppercase tracking-[0.12em] text-kay-subtle">Your price</p>
        <p className="mt-1 font-medium text-kay-fg">{formatNaira(currentAmount)}</p>
        {currentNote && <p className="mt-1 whitespace-pre-wrap text-kay-muted">{currentNote}</p>}
      </div>
    ) : null;
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-xl border border-kay-gold/30 bg-kay-gold-light/20 p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kay-gold">
        {currentAmount ? "Your price (sent to Kay)" : "Send Kay your price"}
      </p>
      <p className="mt-1 text-[12px] text-kay-muted">
        What you&apos;ll charge Kay for this brief. Kay confirms the final price with the client.
        {quotedAt ? ` Last sent ${new Date(quotedAt).toLocaleString("en-NG")}.` : ""}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
        <label className="block text-[12px] text-kay-subtle">
          Price (₦)
          <input
            type="number"
            min={1}
            step={1}
            required
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-kay-border-light bg-kay-surface-elevated px-3 text-[14px] text-kay-fg"
          />
        </label>
        <label className="block text-[12px] text-kay-subtle">
          Note for Kay (optional)
          <input
            type="text"
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. 2 tiers, fondant, ready in 3 days"
            className="mt-1 h-10 w-full rounded-lg border border-kay-border-light bg-kay-surface-elevated px-3 text-[14px] text-kay-fg"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center justify-center rounded-full bg-kay-fg px-5 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Sending…" : currentAmount ? "Update price" : "Send price"}
        </button>
        {saved && <span className="text-[12px] text-emerald-700">Sent to Kay.</span>}
        {error && <span className="text-[12px] text-red-700">{error}</span>}
      </div>
    </form>
  );
}
