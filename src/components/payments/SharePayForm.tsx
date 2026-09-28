"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";

type Props = {
  token: string;
  amountLabel: string;
  defaultName?: string;
  defaultEmail?: string;
  expiresAt: string | null;
};

function hoursLeft(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function SharePayForm({
  token,
  amountLabel,
  defaultName = "",
  defaultEmail = "",
  expiresAt,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState<string | null>(null);

  useEffect(() => {
    setLeft(hoursLeft(expiresAt));
    const t = window.setInterval(() => setLeft(hoursLeft(expiresAt)), 30_000);
    return () => window.clearInterval(t);
  }, [expiresAt]);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "share", token, name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start payment.");
      if (!data.link) throw new Error("Payment link was not returned.");
      window.location.href = data.link;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={pay} className="mt-6 space-y-4">
      <Input
        label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={80}
      />
      <Input
        label="Email for your receipt"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex h-13 w-full items-center justify-center rounded-xl bg-kay-gold py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(184,154,106,0.4)] transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Opening Paystack…" : `Pay ${amountLabel}`}
      </button>
      <p className="text-center text-[11px] text-kay-subtle">
        Secure payment by Paystack · card, transfer or USSD
        {left ? ` · link expires in ${left}` : ""}
      </p>
    </form>
  );
}
