"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/lib/data/home";
import { TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";
import type { TableRequestCategory } from "@/types/table";

const CATEGORIES: { value: TableRequestCategory; label: string }[] = [
  { value: "cake", label: "Custom cake" },
  { value: "chocolate", label: "Chocolates" },
  { value: "hamper", label: "Gourmet hamper" },
  { value: "treat", label: "Treats" },
  { value: "other", label: "Something else" },
];

type Props = {
  defaultContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export function TableRequestForm({ defaultContact }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: "cake" as TableRequestCategory,
    occasion: "",
    servings: "",
    flavourNotes: "",
    styleNotes: "",
    neededBy: "",
    city: "",
    budget: "",
    contactName: defaultContact?.name ?? "",
    contactEmail: defaultContact?.email ?? "",
    contactPhone: defaultContact?.phone ?? "",
  });

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.contactName.trim() || !form.contactEmail.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!form.flavourNotes.trim() && !form.styleNotes.trim()) {
      setError("Tell us a little about flavours or style.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/table/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          occasion: form.occasion.trim() || undefined,
          servings: form.servings.trim() || undefined,
          flavourNotes: form.flavourNotes.trim() || undefined,
          styleNotes: form.styleNotes.trim() || undefined,
          neededBy: form.neededBy || undefined,
          city: form.city.trim() || undefined,
          budget: form.budget
            ? parseIntegerInput(form.budget)
            : undefined,
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit request.");
      router.push(TABLE_ROUTES.requestStatus(data.request.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--table-berry)]">
          Custom request
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-[var(--table-cocoa)] sm:text-[40px]">
          {TABLE_COPY.requestTitle}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--table-muted)]">
          {TABLE_COPY.requestSubtitle}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--table-muted)]">
          What are you ordering?
        </label>
        <select
          value={form.category}
          onChange={(e) =>
            patch("category", e.target.value as TableRequestCategory)
          }
          className="h-11 w-full rounded-lg border border-[var(--table-line)] bg-[var(--table-paper)] px-3.5 text-[13px] outline-none focus:border-[var(--table-cocoa)]"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Occasion"
          value={form.occasion}
          onChange={(e) => patch("occasion", e.target.value)}
          placeholder="Birthday, anniversary…"
        />
        <Input
          label="Servings"
          value={form.servings}
          onChange={(e) => patch("servings", e.target.value)}
          placeholder="e.g. 12–15"
        />
      </div>

      <Textarea
        label="Flavour notes"
        value={form.flavourNotes}
        onChange={(e) => patch("flavourNotes", e.target.value)}
        placeholder="Chocolate ganache, red velvet, fruit…"
        rows={3}
      />

      <Textarea
        label="Frosting / style"
        value={form.styleNotes}
        onChange={(e) => patch("styleNotes", e.target.value)}
        placeholder="Buttercream, floral, minimal, colour palette…"
        rows={3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Date needed"
          type="date"
          value={form.neededBy}
          onChange={(e) => patch("neededBy", e.target.value)}
        />
        <Input
          label="City (delivery / pickup)"
          value={form.city}
          onChange={(e) => patch("city", e.target.value)}
          placeholder="Lagos, Abuja…"
        />
      </div>

      <Input
        label="Budget (₦, optional)"
        value={form.budget}
        onChange={(e) => patch("budget", formatIntegerInput(e.target.value))}
        placeholder="50,000"
      />

      <div className="border-t border-[var(--table-line)] pt-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--table-cocoa)]">
          Contact
        </p>
        <div className="space-y-4">
          <Input
            label="Full name"
            value={form.contactName}
            onChange={(e) => patch("contactName", e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => patch("contactEmail", e.target.value)}
            required
          />
          <Input
            label="Phone"
            value={form.contactPhone}
            onChange={(e) => patch("contactPhone", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-[13px] text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="table-cta inline-flex h-12 w-full items-center justify-center rounded-lg text-[14px] font-semibold disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}
