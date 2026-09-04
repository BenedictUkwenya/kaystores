"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShippingHub } from "@/types/shipping";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type Props = {
  initialHubs: ShippingHub[];
};

type FormState = {
  id?: string;
  name: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  serviceStatesText: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: string;
};

const emptyForm = (): FormState => ({
  name: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  serviceStatesText: "",
  isDefault: false,
  isActive: true,
  sortOrder: "0",
});

function hubToForm(hub: ShippingHub): FormState {
  return {
    id: hub.id,
    name: hub.name,
    line1: hub.address.line1,
    city: hub.address.city,
    state: hub.address.state,
    postalCode: hub.address.postalCode ?? "",
    country: hub.address.country || "Nigeria",
    contactName: hub.contactName,
    contactEmail: hub.contactEmail,
    contactPhone: hub.contactPhone,
    serviceStatesText: hub.serviceStates.join(", "),
    isDefault: hub.isDefault,
    isActive: hub.isActive,
    sortOrder: String(hub.sortOrder),
  };
}

export function AdminShippingHubsManager({ initialHubs }: Props) {
  const router = useRouter();
  const [hubs, setHubs] = useState(initialHubs);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/hubs");
    const data = await res.json();
    if (res.ok) setHubs(data.hubs ?? []);
  }

  async function save() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        address: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode || undefined,
          country: form.country,
        },
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        serviceStatesText: form.serviceStatesText,
        isDefault: form.isDefault,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const res = await fetch(
        form.id ? `/api/admin/hubs/${form.id}` : "/api/admin/hubs",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save hub.");
      await refresh();
      setForm(emptyForm());
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this hub?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/hubs/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete hub.");
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-kay-border-light bg-kay-surface/40 p-5">
        <p className="text-[13px] text-kay-muted">
          Checkout picks a hub by the customer&apos;s <strong>state</strong>.
          List states this hub covers (comma-separated). Leave empty on the
          default hub to cover everywhere else.
        </p>
      </div>

      <div className="space-y-3">
        {hubs.length === 0 && (
          <p className="text-[14px] text-kay-muted">
            No hubs yet. Add Lagos, Abuja, etc. below.
          </p>
        )}
        {hubs.map((hub) => (
          <div
            key={hub.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-kay-border-light bg-kay-surface-elevated p-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-semibold text-kay-fg">{hub.name}</p>
                {hub.isDefault && (
                  <StatusBadge status="paid" label="Default" />
                )}
                {!hub.isActive && (
                  <StatusBadge status="unpaid" label="Inactive" />
                )}
              </div>
              <p className="mt-1 text-[13px] text-kay-muted">
                {hub.address.line1}, {hub.address.city}, {hub.address.state}
              </p>
              <p className="mt-1 text-[12px] text-kay-subtle">
                Serves:{" "}
                {hub.serviceStates.length
                  ? hub.serviceStates.join(", ")
                  : "All states (catch-all)"}
              </p>
              <p className="mt-1 text-[12px] text-kay-subtle">
                {hub.contactName} · {hub.contactPhone} · {hub.contactEmail}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(hubToForm(hub));
                  setEditing(true);
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => remove(hub.id)}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-kay-border bg-kay-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[22px] text-kay-fg">
            {editing ? "Edit hub" : "Add hub"}
          </h2>
          {editing && (
            <button
              type="button"
              className="text-[12px] text-kay-subtle underline"
              onClick={() => {
                setForm(emptyForm());
                setEditing(false);
              }}
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Hub name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Lagos Hub"
            required
          />
          <Input
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
          <Input
            label="Street address"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            className="sm:col-span-2"
            required
          />
          <Input
            label="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
          <Input
            label="State"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            required
          />
          <Input
            label="Postal code"
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <Input
            label="Contact name"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            required
          />
          <Input
            label="Contact phone"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            required
          />
          <Input
            label="Contact email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className="sm:col-span-2"
            required
          />
          <Input
            label="States this hub serves"
            value={form.serviceStatesText}
            onChange={(e) =>
              setForm({ ...form, serviceStatesText: e.target.value })
            }
            hint="Comma-separated, e.g. Lagos, Ogun. Leave empty for catch-all / default."
            className="sm:col-span-2"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-kay-fg">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
            />
            Default hub
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>

        {error && (
          <p className="mt-3 text-[13px] text-red-700">{error}</p>
        )}

        <Button
          type="button"
          className="mt-4"
          onClick={save}
          disabled={loading}
        >
          {loading ? "Saving…" : editing ? "Update hub" : "Add hub"}
        </Button>
      </div>
    </div>
  );
}
