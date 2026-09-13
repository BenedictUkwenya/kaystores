"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderSupportMessage } from "@/types/order-support";

const POLL_MS = 6000;

type Props = {
  orderId: string;
  viewerRole: "admin" | "vendor" | "customer";
};

export function OrderSupportChat({ orderId, viewerRole }: Props) {
  const [messages, setMessages] = useState<OrderSupportMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/support`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load messages.");
          return;
        }
        setMessages(data.messages ?? []);
        if (data.warning) setError(data.warning);
        else setError("");
      } catch {
        setError("Could not load messages.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send.");
      setBody("");
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated">
      <div className="border-b border-kay-border-light px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Order support
        </p>
        <p className="mt-1 text-[13px] text-kay-muted">
          {viewerRole === "customer"
            ? "Message Kay about this order — delivery, the product, or a change."
            : "Talk with the vendor and Kay team about this order."}
        </p>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {loading ? (
          <p className="text-[13px] text-kay-muted">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-[13px] text-kay-muted">
            No messages yet. Ask about the product, address, or fulfilment here.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderRole === viewerRole;
            return (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  mine
                    ? "ml-auto bg-kay-gold/15 text-kay-fg"
                    : "bg-kay-surface text-kay-fg"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-kay-gold">
                  {msg.senderName} · {msg.senderRole}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">
                  {msg.body}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={send}
        className="border-t border-kay-border-light p-3 sm:p-4"
      >
        {error && (
          <p className="mb-2 text-[12px] text-red-500">{error}</p>
        )}
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Write a message…"
            className="min-h-[44px] min-w-0 flex-1 resize-none rounded-xl border border-kay-border bg-kay-input-bg px-3 py-2 text-[13px] text-kay-fg outline-none focus:border-kay-fg"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="self-end rounded-xl bg-kay-fg px-4 py-2 text-[13px] font-medium text-kay-accent-fg disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
