"use client";

import { useId, useState, type FormEvent } from "react";
import { IconArrowRight } from "@/components/ui/Icons";

type Status = "idle" | "saving" | "done" | "error";

export function NewsletterForm() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/launch/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save your email.");
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save your email.");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-4 text-[13px] font-medium text-kay-fg" role="status">
        You&apos;re on the list
      </p>
    );
  }

  return (
    <form className="mt-4" onSubmit={onSubmit}>
      <div className="flex">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? `${inputId}-error` : undefined}
          className="h-11 min-w-0 flex-1 rounded-l-md border border-kay-border bg-kay-input-bg px-3 text-[13px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-fg"
        />
        <button
          type="submit"
          aria-label={status === "saving" ? "Subscribing" : "Subscribe"}
          disabled={status === "saving"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-md bg-kay-accent text-kay-accent-fg transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {status === "saving" ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : (
            <IconArrowRight />
          )}
        </button>
      </div>
      {status === "error" && (
        <p id={`${inputId}-error`} className="mt-2 text-[12px] text-red-600" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
