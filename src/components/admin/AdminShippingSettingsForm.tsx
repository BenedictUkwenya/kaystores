"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShippingSettings } from "@/types/shipping-settings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/data/home";

type Props = {
  initial: ShippingSettings;
};

export function AdminShippingSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [terminalEnabled, setTerminalEnabled] = useState(initial.terminalEnabled);
  const [manualEnabled, setManualEnabled] = useState(initial.manualEnabled);
  const [manualFee, setManualFee] = useState(String(initial.manualFee));
  const [manualLabel, setManualLabel] = useState(initial.manualLabel);
  const [manualEta, setManualEta] = useState(initial.manualEta ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/shipping-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminalEnabled,
          manualEnabled,
          manualFee: Math.max(0, Math.floor(Number(manualFee) || 0)),
          manualLabel,
          manualEta: manualEta.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save settings.");
      setTerminalEnabled(data.settings.terminalEnabled);
      setManualEnabled(data.settings.manualEnabled);
      setManualFee(String(data.settings.manualFee));
      setManualLabel(data.settings.manualLabel);
      setManualEta(data.settings.manualEta ?? "");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-kay-border bg-kay-surface p-5">
      <h2 className="font-serif text-[22px] text-kay-fg">Delivery options</h2>
      <p className="mt-1 text-[13px] text-kay-muted">
        Choose what shoppers see at checkout. You can offer Terminal carrier
        rates, Kay-arranged delivery, or both.
      </p>

      <div className="mt-5 space-y-4">
        <label className="flex items-start gap-3 rounded-lg border border-kay-border-light p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={terminalEnabled}
            onChange={(e) => setTerminalEnabled(e.target.checked)}
          />
          <span>
            <span className="block text-[14px] font-medium text-kay-fg">
              Terminal Africa (live carrier rates)
            </span>
            <span className="mt-0.5 block text-[12px] text-kay-muted">
              Shoppers click “Get live delivery rates” and pick a courier.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-kay-border-light p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={manualEnabled}
            onChange={(e) => setManualEnabled(e.target.checked)}
          />
          <span>
            <span className="block text-[14px] font-medium text-kay-fg">
              Manual Kay delivery
            </span>
            <span className="mt-0.5 block text-[12px] text-kay-muted">
              Kay handles delivery without Terminal. Set fee to 0 for
              complimentary.
            </span>
          </span>
        </label>

        {manualEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kay delivery label"
              value={manualLabel}
              onChange={(e) => setManualLabel(e.target.value)}
              placeholder="Kay delivery"
            />
            <Input
              label="Fee (₦)"
              type="number"
              min={0}
              value={manualFee}
              onChange={(e) => setManualFee(e.target.value)}
              hint={
                Number(manualFee) === 0
                  ? "Shown as complimentary"
                  : `Checkout will charge ${formatNaira(Math.max(0, Math.floor(Number(manualFee) || 0)))}`
              }
            />
            <Input
              label="ETA / note (optional)"
              value={manualEta}
              onChange={(e) => setManualEta(e.target.value)}
              placeholder="Usually 1–3 days after QC"
              className="sm:col-span-2"
            />
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}
      {saved && !error && (
        <p className="mt-3 text-[13px] text-emerald-700">Settings saved.</p>
      )}

      <Button type="button" className="mt-4" onClick={save} disabled={loading}>
        {loading ? "Saving…" : "Save delivery options"}
      </Button>
    </div>
  );
}
