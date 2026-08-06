"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AdminInviteResultDialog } from "@/components/admin/AdminInviteResultDialog";

type InviteMode = "instant" | "profile";

type ResultState = {
  variant: "success" | "error";
  title: string;
  message: string;
  inviteUrl?: string;
} | null;

export function AdminRoleInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [role, setRole] = useState<"admin" | "vendor">("admin");
  const [inviteMode, setInviteMode] = useState<InviteMode>("profile");
  const [result, setResult] = useState<ResultState>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          businessName: role === "vendor" ? businessName : undefined,
          inviteMode: role === "vendor" ? inviteMode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      if (data.action === "upgraded") {
        setResult({
          variant: "success",
          title: data.role === "admin" ? "Admin upgraded" : "Vendor upgraded",
          message:
            data.role === "admin"
              ? "This email already has a Kay account. They now have admin access with their existing password."
              : "This email already has a Kay account. They are now an approved vendor and can sign in with their existing password.",
        });
      } else {
        setResult({
          variant: "success",
          title: "Invite sent",
          message:
            "They get an email titled “Invitation — Kay admin access” with a button to register. Copy the link below if needed — it opens the live site.",
          inviteUrl: data.inviteUrl,
        });
      }
      setEmail("");
      setBusinessName("");
      router.refresh();
    } catch (err) {
      setResult({
        variant: "error",
        title: "Invite failed",
        message: err instanceof Error ? err.message : "Invite failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
        <div className="border-b border-kay-border-light bg-gradient-to-r from-[#111111] via-[#1a1a1a] to-[#111111] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-kay-gold">
            Private invitation
          </p>
          <p className="mt-1 font-serif text-[20px] leading-snug text-white">
            Invite to Kay
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/55">
            Admin or vendor access — existing accounts upgrade instantly. New
            vendor invites can skip KYC.
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
            <>
              <Input
                label="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <div>
                <span className="mb-2.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
                  After they accept
                </span>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-kay-surface p-1">
                  {(
                    [
                      { id: "profile" as const, label: "Profile first" },
                      { id: "instant" as const, label: "Instant access" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setInviteMode(option.id)}
                      className={`rounded-lg py-2.5 text-[12px] font-medium transition-all ${
                        inviteMode === option.id
                          ? "bg-kay-surface-elevated text-kay-fg shadow-sm"
                          : "text-kay-muted hover:text-kay-fg"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-kay-subtle">
                  {inviteMode === "instant"
                    ? "Name, email, password — then portal access already approved (no business profile or NIN)."
                    : "Register + short business profile (phone, catalog). Auto-approved — no NIN / KYC queue."}
                </p>
              </div>
            </>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Sending…"
              : role === "admin"
                ? "Send admin invite"
                : "Send vendor invite"}
          </Button>
        </form>
      </div>

      <AdminInviteResultDialog
        open={Boolean(result)}
        variant={result?.variant ?? "success"}
        title={result?.title ?? ""}
        message={result?.message ?? ""}
        inviteUrl={result?.inviteUrl}
        onClose={() => setResult(null)}
      />
    </>
  );
}
