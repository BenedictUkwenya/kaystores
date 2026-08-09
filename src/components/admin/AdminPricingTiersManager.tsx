"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MarkupTier } from "@/types/pricing";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  formatIntegerInput,
  formatNaira,
  parseIntegerInput,
} from "@/lib/data/home";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type Props = {
  initialTiers: MarkupTier[];
};

type FormState = {
  id?: string;
  minPrice: string;
  maxPrice: string;
  ratePercent: string;
  flatFee: string;
  label: string;
  sortOrder: string;
  active: boolean;
  unlimited: boolean;
};

function previewMarkup(vendorPrice: number, tiers: MarkupTier[]): number {
  if (vendorPrice <= 0) return 0;
  const active = tiers.filter((t) => t.active);
  const list = active.length ? active : tiers;
  const tier =
    list.find((t) => {
      if (vendorPrice < t.minPrice) return false;
      if (t.maxPrice != null && vendorPrice > t.maxPrice) return false;
      return true;
    }) ?? list[list.length - 1];
  if (!tier) return Math.round(vendorPrice * 1.15);
  return Math.round(vendorPrice * (1 + tier.rate) + tier.flatFee);
}

const emptyForm = (): FormState => ({
  minPrice: "0",
  maxPrice: "",
  ratePercent: "15",
  flatFee: "0",
  label: "",
  sortOrder: "0",
  active: true,
  unlimited: true,
});

function tierToForm(tier: MarkupTier): FormState {
  return {
    id: tier.id,
    minPrice: String(tier.minPrice),
    maxPrice: tier.maxPrice == null ? "" : String(tier.maxPrice),
    ratePercent: String(Math.round(tier.rate * 10000) / 100),
    flatFee: String(tier.flatFee),
    label: tier.label ?? "",
    sortOrder: String(tier.sortOrder),
    active: tier.active,
    unlimited: tier.maxPrice == null,
  };
}

export function AdminPricingTiersManager({ initialTiers }: Props) {
  const router = useRouter();
  const [tiers, setTiers] = useState(initialTiers);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewVendor, setPreviewVendor] = useState("50000");

  const previewCustomer = useMemo(() => {
    return previewMarkup(parseIntegerInput(previewVendor), tiers);
  }, [previewVendor, tiers]);

  function startCreate() {
    setForm(emptyForm());
    setEditing(true);
    setError("");
  }

  function startEdit(tier: MarkupTier) {
    setForm(tierToForm(tier));
    setEditing(true);
    setError("");
  }

  function cancelEdit() {
    setEditing(false);
    setForm(emptyForm());
    setError("");
  }

  async function save() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        minPrice: parseIntegerInput(form.minPrice),
        maxPrice: form.unlimited ? null : parseIntegerInput(form.maxPrice),
        ratePercent: Number(form.ratePercent) || 0,
        flatFee: parseIntegerInput(form.flatFee),
        label: form.label.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };

      const res = await fetch(
        form.id
          ? `/api/admin/pricing/tiers/${form.id}`
          : "/api/admin/pricing/tiers",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setEditing(false);
      setForm(emptyForm());
      router.refresh();
      const listRes = await fetch("/api/admin/pricing/tiers");
      const listData = await listRes.json();
      if (listRes.ok) setTiers(listData.tiers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this markup tier?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pricing/tiers/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setTiers((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-kay-border-light bg-kay-surface/80 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Preview
        </p>
        <p className="mt-2 text-[13px] text-kay-muted">
          Enter a vendor list price to see what the customer pays with current
          active tiers.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:max-w-xs sm:flex-1">
            <Input
              label="Vendor list price (₦)"
              value={previewVendor}
              onChange={(e) =>
                setPreviewVendor(formatIntegerInput(e.target.value))
              }
            />
          </div>
          <p className="pb-2 text-[15px] font-medium text-kay-fg">
            Customer pays {formatNaira(previewCustomer)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-kay-fg">Markup tiers</h2>
          <p className="mt-1 text-[13px] text-kay-muted">
            Ranges use vendor list price. Formula: round(price × (1 + %) + flat
            ₦).
          </p>
        </div>
        {!editing && (
          <Button type="button" size="sm" onClick={startCreate}>
            Add tier
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {editing && (
        <div className="space-y-4 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
            {form.id ? "Edit tier" : "New tier"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Min price (₦)"
              value={form.minPrice}
              onChange={(e) =>
                setForm({ ...form, minPrice: formatIntegerInput(e.target.value) })
              }
            />
            <div>
              <Input
                label="Max price (₦)"
                value={form.maxPrice}
                disabled={form.unlimited}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxPrice: formatIntegerInput(e.target.value),
                  })
                }
              />
              <label className="mt-2 flex items-center gap-2 text-[12px] text-kay-muted">
                <input
                  type="checkbox"
                  checked={form.unlimited}
                  onChange={(e) =>
                    setForm({ ...form, unlimited: e.target.checked })
                  }
                />
                No upper limit
              </label>
            </div>
            <Input
              label="Markup %"
              value={form.ratePercent}
              onChange={(e) =>
                setForm({ ...form, ratePercent: e.target.value })
              }
              hint="e.g. 15 for 15%"
            />
            <Input
              label="Flat fee (₦)"
              value={form.flatFee}
              onChange={(e) =>
                setForm({ ...form, flatFee: formatIntegerInput(e.target.value) })
              }
            />
            <Input
              label="Label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Mid range"
            />
            <Input
              label="Sort order"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-kay-muted">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={loading} onClick={save}>
              {loading ? "Saving…" : "Save tier"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-kay-border-light">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="border-b border-kay-border-light bg-kay-surface text-[11px] uppercase tracking-[0.1em] text-kay-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">Range</th>
              <th className="px-4 py-3 font-semibold">%</th>
              <th className="px-4 py-3 font-semibold">Flat</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-kay-muted"
                >
                  No tiers yet. Add one to replace the fallback 15%.
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr
                  key={tier.id}
                  className="border-b border-kay-border-light last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-kay-fg">
                      {tier.label || "Untitled"}
                    </p>
                    <p className="text-[12px] text-kay-muted">
                      {formatNaira(tier.minPrice)} –{" "}
                      {tier.maxPrice == null
                        ? "∞"
                        : formatNaira(tier.maxPrice)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-kay-fg">
                    {(tier.rate * 100).toFixed(
                      (tier.rate * 100) % 1 === 0 ? 0 : 2,
                    )}
                    %
                  </td>
                  <td className="px-4 py-3 text-kay-fg">
                    {formatNaira(tier.flatFee)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={tier.active ? "active" : "draft"}
                      label={tier.active ? "Active" : "Inactive"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => startEdit(tier)}
                        className="text-[12px] font-medium text-kay-fg underline-offset-2 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => remove(tier.id)}
                        className="text-[12px] font-medium text-red-700 underline-offset-2 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
