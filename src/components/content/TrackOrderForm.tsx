"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not find that order.");
        return;
      }

      router.push(`/order/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Order reference"
        name="orderNumber"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="e.g. KAY-ABC123"
        required
        autoComplete="off"
      />
      <Input
        label="Email used at checkout"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        autoComplete="email"
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-kay-fg px-8 text-[14px] font-medium text-kay-bg transition-opacity hover:opacity-90 disabled:opacity-50 sm:self-start"
      >
        {loading ? "Looking up…" : "Track order"}
      </button>
    </form>
  );
}
