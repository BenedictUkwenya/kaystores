"use client";

import { useState } from "react";
import type { Order } from "@/types/order";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";

const emptyAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
};

type HandoverFormProps = {
  token: string;
  order: Order;
};

export function HandoverForm({ token, order }: HandoverFormProps) {
  const [address, setAddress] = useState(emptyAddress);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(
    order.handoverStatus === "completed",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!address.line1 || !address.city || !address.state) {
      setError("Please complete all required address fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/handover/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not submit address.");
      }

      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="mt-6 font-serif text-[28px] text-kay-fg sm:text-[32px]">
          Thank you
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-kay-muted">
          Your delivery details have been received securely. Your gift from Kay
          Stores is on its way — we&apos;ll be in touch when it ships.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <Logo size="md" />
      </div>

      <p className="text-center text-[11px] uppercase tracking-[0.14em] text-kay-gold">
        Digital Handover
      </p>
      <h1 className="mt-2 text-center font-serif text-[28px] text-kay-fg sm:text-[32px]">
        Someone thought of you
      </h1>
      <p className="mx-auto mt-3 max-w-md text-center text-[14px] leading-relaxed text-kay-muted">
        {order.gift?.anonymous
          ? "A thoughtful gift is being prepared for you. Share your delivery address below — your details stay private and secure."
          : `${order.buyer.fullName} is sending you a gift through Kay Stores. Share your delivery address to receive it.`}
      </p>

      {order.gift?.note && (
        <blockquote className="mx-auto mt-6 max-w-md rounded-lg border border-kay-border-light bg-kay-surface px-5 py-4 text-center">
          <p className="font-serif text-[15px] italic leading-relaxed text-kay-fg">
            &ldquo;{order.gift.note}&rdquo;
          </p>
        </blockquote>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-8 max-w-md space-y-4 rounded-lg border border-kay-border-light bg-kay-surface-elevated/60 p-5 sm:p-6"
      >
        <h2 className="font-serif text-[18px] text-kay-fg">Delivery address</h2>
        <Input
          label="Address line 1"
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
          required
        />
        <Input
          label="Address line 2"
          value={address.line2}
          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            required
          />
          <Input
            label="State"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            required
          />
        </div>
        <Input
          label="Postal code"
          value={address.postalCode}
          onChange={(e) =>
            setAddress({ ...address, postalCode: e.target.value })
          }
        />
        <Input
          label="Country"
          value={address.country}
          onChange={(e) => setAddress({ ...address, country: e.target.value })}
          required
        />

        {error && (
          <p className="text-[13px] text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Confirm Delivery Address"}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-kay-subtle">
          Your information is encrypted and used only for this delivery.
        </p>
      </form>
    </div>
  );
}
