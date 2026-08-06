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

export function AdminInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
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
          role: "vendor",
          businessName,
          inviteMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      if (data.action === "upgraded") {
        setResult({
          variant: "success",
          title: "Vendor upgraded",
          message:
            "This email already has a Kay account. They are now an approved vendor and can sign in with their existing password.",
        });
        setEmail("");
        setBusinessName("");
      } else {
        setResult({
          variant: "success",
          title: "Invite sent",
          message:
            "They get an email titled “Invitation — Kay vendor access” with a button to register (name, password, and details). Copy the link below if email is slow or lands in spam — it opens the live site.",
          inviteUrl: data.inviteUrl,
        });
        setEmail("");
        setBusinessName("");
      }
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
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
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
                { id: "profile" as const, label: "Complete profile first" },
                { id: "instant" as const, label: "Instant portal access" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setInviteMode(option.id)}
                className={`rounded-lg px-2 py-2.5 text-[12px] font-medium transition-all ${
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
              ? "They register with name, email, and password, then enter the vendor portal already approved (no business profile or NIN)."
              : "They register, then complete a short business profile (phone, catalog). Auto-approved — no NIN / KYC queue."}
          </p>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Send invite"}
        </Button>
      </form>

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
