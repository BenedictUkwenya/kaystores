"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSubmitted(true);
      form.reset();
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-8 text-center">
        <p className="font-serif text-2xl text-kay-fg">Message received</p>
        <p className="mt-3 text-[14px] text-kay-muted">
          Our team will respond within one business day.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-[13px] font-medium text-kay-gold hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="First name" name="firstName" required />
        <Input label="Last name" name="lastName" required />
      </div>
      <Input label="Email" name="email" type="email" required />
      <Input label="Subject" name="subject" required />
      <Textarea
        label="Message"
        name="message"
        rows={5}
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="How can we help?"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 items-center justify-center rounded-full bg-kay-fg px-8 text-[14px] font-medium text-kay-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
      <p className="text-[12px] text-kay-subtle">
        For special sourcing requests, use our{" "}
        <Link href="/concierge" className="text-kay-gold hover:underline">
          Concierge form
        </Link>
        .
      </p>
    </form>
  );
}
