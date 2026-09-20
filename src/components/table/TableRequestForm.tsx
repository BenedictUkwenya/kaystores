"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/lib/data/home";
import { TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";
import type {
  TableFulfillmentMethod,
  TableRequestCategory,
} from "@/types/table";

const CATEGORIES: { value: TableRequestCategory; label: string }[] = [
  { value: "cake", label: "Custom cake" },
  { value: "chocolate", label: "Chocolates" },
  { value: "hamper", label: "Gourmet hamper" },
  { value: "treat", label: "Treats" },
  { value: "other", label: "Something else" },
];

type HubOption = {
  id: string;
  name: string;
  city: string;
  state: string;
  line1: string;
};

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
  const [deliveryLabel, setDeliveryLabel] = useState("Kay delivery");
  const [deliveryEta, setDeliveryEta] = useState<string | null>(null);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [form, setForm] = useState({
    category: "cake" as TableRequestCategory,
    occasion: "",
    servings: "",
    flavourNotes: "",
    styleNotes: "",
    neededBy: "",
    fulfillmentMethod: "delivery" as TableFulfillmentMethod,
    city: "",
    state: "",
    pickupHubId: "",
    budget: "",
    contactName: defaultContact?.name ?? "",
    contactEmail: defaultContact?.email ?? "",
    contactPhone: defaultContact?.phone ?? "",
  });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/table/fulfillment");
        const data = await res.json();
        if (!res.ok) return;
        setDeliveryEnabled(data.delivery?.enabled !== false);
        setDeliveryLabel(data.delivery?.label || "Kay delivery");
        setDeliveryEta(data.delivery?.eta ?? null);
        const list = (data.hubs ?? []) as HubOption[];
        setHubs(list);
        setForm((prev) => {
          if (prev.pickupHubId || list.length === 0) return prev;
          return { ...prev, pickupHubId: list[0].id };
        });
        if (data.delivery?.enabled === false && list.length > 0) {
          setForm((prev) => ({ ...prev, fulfillmentMethod: "pickup" }));
        }
      } catch {
        /* keep defaults */
      }
    })();
  }, []);

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

    if (form.fulfillmentMethod === "delivery") {
      if (!form.city.trim() || !form.state.trim()) {
        setError("City and state are required for Kay delivery.");
        return;
      }
    } else {
      const hub = hubs.find((h) => h.id === form.pickupHubId);
      if (!hub) {
        setError("Choose a Kay hub for pickup.");
        return;
      }
    }

    const hub = hubs.find((h) => h.id === form.pickupHubId);

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
          fulfillmentMethod: form.fulfillmentMethod,
          city:
            form.fulfillmentMethod === "delivery"
              ? form.city.trim()
              : undefined,
          state:
            form.fulfillmentMethod === "delivery"
              ? form.state.trim()
              : undefined,
          pickupHubId:
            form.fulfillmentMethod === "pickup" ? hub?.id : undefined,
          pickupHubName:
            form.fulfillmentMethod === "pickup" ? hub?.name : undefined,
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
        <p className="text-[11px] uppercase tracking-[0.18em] text-kay-gold">
          Custom request
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[40px]">
          {TABLE_COPY.requestTitle}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-kay-muted">
          {TABLE_COPY.requestSubtitle}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
          What are you ordering?
        </label>
        <select
          value={form.category}
          onChange={(e) =>
            patch("category", e.target.value as TableRequestCategory)
          }
          className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px] outline-none focus:border-kay-fg"
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

      <Input
        label="Date needed"
        type="date"
        value={form.neededBy}
        onChange={(e) => patch("neededBy", e.target.value)}
      />

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
          How should we get it to you?
        </p>
        <p className="mb-3 text-[12px] text-kay-muted">
          Kitchen orders use Kay fulfilment only — not a live carrier quote.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {deliveryEnabled && (
            <button
              type="button"
              onClick={() => patch("fulfillmentMethod", "delivery")}
              className={`rounded-xl border p-4 text-left transition-colors ${
                form.fulfillmentMethod === "delivery"
                  ? "border-kay-fg bg-kay-surface"
                  : "border-kay-border hover:border-kay-fg/40"
              }`}
            >
              <p className="text-[13px] font-semibold text-kay-fg">
                {deliveryLabel}
              </p>
              <p className="mt-1 text-[12px] text-kay-muted">
                {deliveryEta ||
                  "Kay arranges delivery after your cake is ready."}
              </p>
            </button>
          )}
          <button
            type="button"
            onClick={() => patch("fulfillmentMethod", "pickup")}
            disabled={hubs.length === 0}
            className={`rounded-xl border p-4 text-left transition-colors disabled:opacity-50 ${
              form.fulfillmentMethod === "pickup"
                ? "border-kay-fg bg-kay-surface"
                : "border-kay-border hover:border-kay-fg/40"
            }`}
          >
            <p className="text-[13px] font-semibold text-kay-fg">
              Pickup at Kay hub
            </p>
            <p className="mt-1 text-[12px] text-kay-muted">
              Collect from a Kay hub when ready.
            </p>
          </button>
        </div>
      </div>

      {form.fulfillmentMethod === "delivery" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            value={form.city}
            onChange={(e) => patch("city", e.target.value)}
            placeholder="e.g. Ikeja"
            required
          />
          <Input
            label="State"
            value={form.state}
            onChange={(e) => patch("state", e.target.value)}
            placeholder="e.g. Lagos"
            required
          />
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Pickup hub
          </label>
          {hubs.length === 0 ? (
            <p className="text-[13px] text-kay-muted">
              No Kay hubs are listed yet. Choose Kay delivery, or contact us.
            </p>
          ) : (
            <select
              value={form.pickupHubId}
              onChange={(e) => patch("pickupHubId", e.target.value)}
              className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px] outline-none focus:border-kay-fg"
              required
            >
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {h.city ? ` — ${h.city}` : ""}
                  {h.state ? `, ${h.state}` : ""}
                </option>
              ))}
            </select>
          )}
          {hubs.find((h) => h.id === form.pickupHubId)?.line1 && (
            <p className="mt-2 text-[12px] text-kay-muted">
              {hubs.find((h) => h.id === form.pickupHubId)?.line1}
            </p>
          )}
        </div>
      )}

      <Input
        label="Budget (₦, optional)"
        value={form.budget}
        onChange={(e) => patch("budget", formatIntegerInput(e.target.value))}
        placeholder="50,000"
      />

      <div className="border-t border-kay-border-light pt-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-fg">
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
        className="table-cta inline-flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}
