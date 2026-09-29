"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatChannel } from "@/types/order-support";

const POLL_MS = 6000;

type Role = "admin" | "vendor" | "customer";

type Message = {
  id: string;
  senderRole: Role;
  senderName: string;
  body: string;
  createdAt: string;
};

type Props = {
  apiBase: string;
  viewerRole: Role;
  title: string;
  /** Subtitle per viewer. */
  description: string;
  emptyText: string;
  /** Tab labels for the admin view. */
  customerLabel?: string;
  vendorLabel?: string;
  /** Disable the vendor tab (e.g. no baker assigned yet). */
  vendorUnavailable?: string;
  /** Admin only: one private thread per vendor on multi-vendor orders. */
  vendorThreads?: { id: string; name: string }[];
  minHeight?: string;
};

function roleLabel(role: Role, vendorLabel: string) {
  if (role === "admin") return "Kay";
  if (role === "vendor") return vendorLabel;
  return "Customer";
}

export function RelayChat({
  apiBase,
  viewerRole,
  title,
  description,
  emptyText,
  customerLabel = "Customer",
  vendorLabel = "Vendor",
  vendorUnavailable,
  vendorThreads,
  minHeight = "min-h-[400px]",
}: Props) {
  const isAdmin = viewerRole === "admin";
  const [channel, setChannel] = useState<ChatChannel>(
    viewerRole === "vendor" ? "vendor" : "customer",
  );
  const [vendorId, setVendorId] = useState(vendorThreads?.[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const url = isAdmin
    ? `${apiBase}?channel=${channel}${channel === "vendor" && vendorId ? `&vendorId=${vendorId}` : ""}`
    : apiBase;

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load messages.");
          return;
        }
        setMessages(data.messages ?? []);
        setError(data.warning ?? "");
      } catch {
        setError("Could not load messages.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [url],
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

  async function post(text: string, target: ChatChannel) {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: text,
        channel: target,
        ...(isAdmin && target === "vendor" && vendorId ? { vendorId } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not send.");
    return data.message as Message;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await post(text, channel);
      setBody("");
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  async function relay(msg: Message) {
    const target: ChatChannel = channel === "customer" ? "vendor" : "customer";
    const from = channel === "customer" ? customerLabel : vendorLabel;
    setSending(true);
    setError("");
    setNotice("");
    try {
      await post(`${from} says: ${msg.body}`, target);
      setNotice(
        `Relayed to ${target === "vendor" ? vendorLabel.toLowerCase() : customerLabel.toLowerCase()}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not relay.");
    } finally {
      setSending(false);
    }
  }

  const vendorDisabled = Boolean(vendorUnavailable);
  const composerDisabled = isAdmin && channel === "vendor" && vendorDisabled;

  return (
    <div
      className={`flex ${minHeight} flex-col overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated`}
    >
      <div className="border-b border-kay-border-light px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          {title}
        </p>
        <p className="mt-1 text-[13px] text-kay-muted">{description}</p>
        {isAdmin && (
          <div className="mt-3 inline-flex rounded-full border border-kay-border-light bg-kay-surface p-1">
            {(
              [
                ["customer", customerLabel],
                ["vendor", vendorLabel],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setChannel(value);
                  setNotice("");
                }}
                className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition ${
                  channel === value
                    ? "bg-kay-accent text-kay-accent-fg"
                    : "text-kay-muted hover:text-kay-fg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {isAdmin && channel === "vendor" && vendorThreads && vendorThreads.length > 1 && (
          <label className="mt-3 flex items-center gap-2 text-[12px] text-kay-muted">
            Thread with
            <select
              value={vendorId}
              onChange={(e) => {
                setVendorId(e.target.value);
                setNotice("");
              }}
              className="h-8 rounded-lg border border-kay-border bg-kay-input-bg px-2 text-[12px] text-kay-fg"
            >
              {vendorThreads.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
      >
        {composerDisabled ? (
          <p className="text-[13px] text-kay-muted">{vendorUnavailable}</p>
        ) : loading ? (
          <p className="text-[13px] text-kay-muted">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-[13px] text-kay-muted">{emptyText}</p>
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
                  {msg.senderName} · {roleLabel(msg.senderRole, vendorLabel)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">
                  {msg.body}
                </p>
                {isAdmin && !mine && !(channel === "customer" && vendorDisabled) && (
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void relay(msg)}
                    className="mt-2 text-[11px] font-medium text-kay-gold underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    Relay to {channel === "customer" ? vendorLabel.toLowerCase() : customerLabel.toLowerCase()} →
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} className="border-t border-kay-border-light p-3 sm:p-4">
        {error && <p className="mb-2 text-[12px] text-red-600">{error}</p>}
        {notice && <p className="mb-2 text-[12px] text-emerald-700">{notice}</p>}
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={2000}
            disabled={composerDisabled}
            placeholder={
              isAdmin
                ? `Message the ${channel === "vendor" ? vendorLabel.toLowerCase() : customerLabel.toLowerCase()}…`
                : "Write a message to Kay…"
            }
            className="min-h-[44px] min-w-0 flex-1 resize-none rounded-xl border border-kay-border bg-kay-input-bg px-3 py-2 text-[13px] text-kay-fg outline-none focus:border-kay-fg disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !body.trim() || composerDisabled}
            className="self-end rounded-xl bg-kay-accent px-4 py-2 text-[13px] font-medium text-kay-accent-fg disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
