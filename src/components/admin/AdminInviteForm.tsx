"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AdminInviteForm() {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "vendor", businessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      if (data.action === "upgraded") {
        setResult("Existing account upgraded to vendor.");
      } else {
        setResult(data.inviteUrl ?? "Invite sent.");
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]">
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Generate invite link"}
      </Button>
      {result && (
        <p className="break-all rounded-lg bg-kay-surface px-3 py-2 font-mono text-[11px] text-kay-fg">
          {result}
        </p>
      )}
    </form>
  );
}
