"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  available: number;
};

export function WithdrawForm({ available }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.push("/vendor/wallet");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]">
      <p className="text-[14px] text-kay-muted">
        Available balance: ₦{available.toLocaleString("en-NG")}
      </p>
      <Input
        label="Withdrawal amount (₦)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        hint="Minimum ₦10,000"
        required
      />
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Submitting…" : "Request withdrawal"}
        </Button>
        <Link href="/vendor/wallet" className="w-full sm:w-auto">
          <Button type="button" variant="secondary" className="w-full">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
