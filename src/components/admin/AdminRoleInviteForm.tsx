"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AdminRoleInviteForm() {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [role, setRole] = useState<"admin" | "vendor">("admin");
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
        body: JSON.stringify({ email, role, businessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      if (data.action === "upgraded") {
        setResult(
          `Existing account upgraded to ${data.role}. They can sign in with their current credentials.`,
        );
      } else {
        setResult(
          `Invitation sent. Share this link if email delivery fails:\n${data.inviteUrl}`,
        );
      }
      setEmail("");
      setBusinessName("");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
      <div className="border-b border-kay-border-light bg-gradient-to-r from-[#111111] via-[#1a1a1a] to-[#111111] px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-kay-gold">
          Private invitation
        </p>
        <p className="mt-1 font-serif text-[20px] leading-snug text-white">
          Invite to Kay
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-white/55">
          Admin or vendor access — existing accounts upgrade instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div>
          <span className="mb-2.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Invite as
          </span>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-kay-surface p-1">
            {(["admin", "vendor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-lg py-2.5 text-[12px] font-medium capitalize transition-all ${
                  role === r
                    ? "bg-kay-surface-elevated text-kay-fg shadow-sm"
                    : "text-kay-muted hover:text-kay-fg"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {role === "vendor" && (
          <Input
            label="Business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            hint="Optional — defaults to their email prefix"
          />
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : role === "admin" ? "Send admin invite" : "Send vendor invite"}
        </Button>

        {result && (
          <p className="whitespace-pre-wrap break-all rounded-xl border border-kay-border-light bg-kay-surface px-4 py-3 text-[12px] leading-relaxed text-kay-muted">
            {result}
          </p>
        )}
      </form>
    </div>
  );
}
