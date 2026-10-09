"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/data/home";
import type { FeaturedSlot } from "@/lib/ai/featured";

type ProductOption = { id: string; name: string; price: number };

export function AdminKayFeatured({
  products,
  slots,
}: {
  products: ProductOption[];
  slots: FeaturedSlot[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? products.filter((product) => product.name.toLowerCase().includes(needle))
      : products;
    return list.slice(0, 12);
  }, [products, query]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/kay-featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          amountNgn: Number(amount),
          startsAt,
          endsAt,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setAmount("");
      setNote("");
      setProductId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/kay-featured/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="max-w-xl space-y-4">
        <label className="block text-[13px] text-kay-muted">
          Find a product
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg px-3 text-kay-fg"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {matches.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setProductId(product.id)}
              className={`rounded-full border px-3 py-1 text-[12px] ${
                productId === product.id
                  ? "border-kay-fg text-kay-fg"
                  : "border-kay-border text-kay-muted"
              }`}
            >
              {product.name}
            </button>
          ))}
        </div>
        <label className="block text-[13px] text-kay-muted">
          Amount paid (₦)
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg px-3 text-kay-fg"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[13px] text-kay-muted">
            Starts
            <input
              type="date"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg px-3 text-kay-fg"
            />
          </label>
          <label className="block text-[13px] text-kay-muted">
            Ends
            <input
              type="date"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg px-3 text-kay-fg"
            />
          </label>
        </div>
        <label className="block text-[13px] text-kay-muted">
          Note
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg px-3 text-kay-fg"
          />
        </label>
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || !productId}
          className="h-11 rounded-full bg-kay-accent px-5 text-[13px] text-kay-accent-fg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save slot"}
        </button>
      </form>

      <ul className="divide-y divide-kay-border">
        {slots.map((slot) => (
          <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-[14px] text-kay-fg">{slot.productName}</p>
              <p className="text-[12px] text-kay-muted">
                {formatNaira(slot.amountNgn)} · {slot.startsAt} to {slot.endsAt}
                {slot.note ? ` · ${slot.note}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void remove(slot.id)}
              className="text-[12px] text-kay-subtle hover:text-kay-fg"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
