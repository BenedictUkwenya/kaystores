"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
  handoverUrl?: string;
};

export function GiftRecipientNotice({
  orderId,
  buyerEmail,
  recipientName,
  recipientEmail,
  handoverUrl,
}: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleResend() {
    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/orders/resend-gift-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, buyerEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not resend. Try again.");
        return;
      }

      setStatus("sent");
      setMessage(`Notification resent to ${recipientEmail}.`);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-lg border border-kay-gold/30 bg-kay-beta-bg/50 px-4 py-4">
      <h2 className="text-[13px] font-medium text-kay-fg">
        Gift notification
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-kay-muted">
        We email <span className="font-medium text-kay-fg">{recipientName}</span>{" "}
        at{" "}
        <span className="font-medium text-kay-fg">{recipientEmail}</span> when the
        order is placed. If they don&apos;t see it, ask them to check{" "}
        <strong>Spam</strong> and <strong>Promotions</strong> in Gmail, or search
        for &quot;Kay Stores&quot; — then tap resend below.
      </p>

      {handoverUrl && (
        <p className="mt-3 text-[12px] leading-relaxed text-kay-muted">
          You can also share the handover link directly:
        </p>
      )}
      {handoverUrl && (
        <p className="mt-2 break-all rounded-md bg-kay-bg px-3 py-2 font-mono text-[11px] text-kay-fg">
          {handoverUrl}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={status === "sending"}
          className="inline-flex h-9 items-center justify-center rounded-full border border-kay-fg px-4 text-[12px] font-medium text-kay-fg transition-colors hover:bg-kay-surface disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Resend to recipient"}
        </button>
        {message && (
          <p
            className={`text-[12px] ${status === "error" ? "text-red-600" : "text-kay-muted"}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
