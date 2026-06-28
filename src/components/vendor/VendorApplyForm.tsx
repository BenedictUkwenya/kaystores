"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function VendorApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") ?? "";

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          contactEmail,
          contactPhone,
          catalogDescription,
          inviteToken: inviteToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Application failed");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-8 text-center shadow-[var(--kay-card-shadow)]">
        <p className="font-serif text-[28px] text-kay-fg">Application received</p>
        <p className="mt-3 text-[14px] text-kay-muted">
          Our team will review your application within 1–2 business days. You will
          receive an email when approved.
        </p>
        <Link
          href="/account"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium"
        >
          Back to account
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] sm:p-8"
    >
      {inviteToken && (
        <p className="rounded-lg border border-kay-gold/30 bg-kay-gold-light/40 px-4 py-3 text-[13px] text-kay-fg">
          You were invited to join Kay&apos;s vendor network. Complete your application below.
        </p>
      )}

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
          label="Contact email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
        />
      </div>
      <Input
        label="Phone"
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
        required
      />
      <Textarea
        label="Catalog description"
        value={catalogDescription}
        onChange={(e) => setCatalogDescription(e.target.value)}
        hint="What products do you sell? Brands, categories, price range."
        rows={4}
        required
      />

      {error && (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
