"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Vendor } from "@/types/dashboard";
import type { AddressDetails } from "@/types/order";

type Props = { vendor: Vendor };

const emptyAddress: AddressDetails = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
};

export function VendorSettingsForm({ vendor }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(vendor.businessName);
  const [contactName, setContactName] = useState(vendor.contactName);
  const [contactPhone, setContactPhone] = useState(vendor.contactPhone);
  const [catalogDescription, setCatalogDescription] = useState(
    vendor.catalogDescription,
  );
  const [bankName, setBankName] = useState(vendor.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(vendor.accountNumber ?? "");
  const [accountName, setAccountName] = useState(vendor.accountName ?? "");
  const [pickupAddress, setPickupAddress] = useState<AddressDetails>(
    vendor.pickupAddress ?? emptyAddress,
  );
  const [returnAddress, setReturnAddress] = useState<AddressDetails>(
    vendor.returnAddress ?? vendor.pickupAddress ?? emptyAddress,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          contactPhone,
          catalogDescription,
          bankName,
          accountNumber,
          accountName,
          pickupAddress,
          returnAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] sm:p-8"
    >
      <Input
        label="Business name"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Contact name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          required
        />
        <Input
          label="Phone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
        />
      </div>
      <Textarea
        label="Catalog description"
        value={catalogDescription}
        onChange={(e) => setCatalogDescription(e.target.value)}
        rows={3}
      />

      <div className="border-t border-kay-border-light pt-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Pickup & return address
        </p>
        <p className="mb-4 text-[12px] text-kay-muted">
          Stored for future direct-vendor shipping. Today Kay still dispatches from the hub after QC.
        </p>
        <div className="space-y-4">
          <Input
            label="Pickup street address"
            value={pickupAddress.line1}
            onChange={(e) =>
              setPickupAddress({ ...pickupAddress, line1: e.target.value })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="City"
              value={pickupAddress.city}
              onChange={(e) =>
                setPickupAddress({ ...pickupAddress, city: e.target.value })
              }
            />
            <Input
              label="State"
              value={pickupAddress.state}
              onChange={(e) =>
                setPickupAddress({ ...pickupAddress, state: e.target.value })
              }
            />
            <Input
              label="Postal code"
              value={pickupAddress.postalCode ?? ""}
              onChange={(e) =>
                setPickupAddress({
                  ...pickupAddress,
                  postalCode: e.target.value,
                })
              }
            />
            <Input
              label="Country"
              value={pickupAddress.country}
              onChange={(e) =>
                setPickupAddress({ ...pickupAddress, country: e.target.value })
              }
            />
          </div>
          <Input
            label="Return street address"
            value={returnAddress.line1}
            onChange={(e) =>
              setReturnAddress({ ...returnAddress, line1: e.target.value })
            }
            hint="Defaults can match pickup if returns go back to the same location."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Return city"
              value={returnAddress.city}
              onChange={(e) =>
                setReturnAddress({ ...returnAddress, city: e.target.value })
              }
            />
            <Input
              label="Return state"
              value={returnAddress.state}
              onChange={(e) =>
                setReturnAddress({ ...returnAddress, state: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="border-t border-kay-border-light pt-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Payout bank details
        </p>
        <div className="space-y-5">
          <Input
            label="Bank name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <Input
            label="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <Input
            label="Account name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>
      </div>

      {vendor.canListAfterDark && (
        <p className="rounded-lg border border-ad-amber/30 bg-ad-amber/10 px-4 py-3 text-[13px] text-kay-fg">
          Trusted vendor — you may list After Dark products.
        </p>
      )}

      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {saved && <p className="text-[13px] text-emerald-700">Settings saved.</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
