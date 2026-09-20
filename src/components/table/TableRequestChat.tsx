"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TableRequestMessage, TableSenderRole } from "@/types/table";

const POLL_MS = 6000;

type Props = {
  requestId: string;
  viewerRole: TableSenderRole;
  apiBase?: string;
};

export function TableRequestChat({
  requestId,
  viewerRole,
  apiBase = `/api/table/requests/${requestId}/messages`,
}: Props) {
  const [messages, setMessages] = useState<TableRequestMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(apiBase);
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
    [apiBase],
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
      const res = await fetch(apiBase, {
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
    <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated">
      <div className="border-b border-kay-border-light px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Request chat
        </p>
        <p className="mt-1 text-[13px] text-kay-muted">
          {viewerRole === "customer"
            ? "Message Kay or your baker about this request."
            : "Reply to the client about this cake brief."}
        </p>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
      >
        {loading ? (
          <p className="text-[13px] text-kay-muted">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-[13px] text-kay-muted">
            No messages yet. Ask about flavours, timing, or delivery here.
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

      {error && (
        <p className="px-4 text-[12px] text-red-700 sm:px-5">{error}</p>
      )}

      <form
        onSubmit={send}
        className="flex gap-2 border-t border-kay-border-light p-3 sm:p-4"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="h-11 flex-1 rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px] outline-none focus:border-kay-fg"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="h-11 shrink-0 rounded-lg bg-kay-accent px-5 text-[13px] font-semibold text-kay-accent-fg disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
