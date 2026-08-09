"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupportMessage, SupportThread } from "@/types/support";
import { IconUpload } from "@/components/ui/Icons";

const POLL_MS = 5000;

type ThreadResponse = {
  thread: SupportThread;
  messages: SupportMessage[];
  error?: string;
};

export function SupportChat() {
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const focused = useRef(true);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const loadThread = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/support/thread");
      const data = (await res.json()) as ThreadResponse;
      if (!res.ok) {
        setError(data.error || "Could not load conversation.");
        return;
      }
      setThread(data.thread);
      setMessages(data.messages);
      setError(null);
    } catch {
      setError("Could not load conversation.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    const onFocus = () => {
      focused.current = true;
      void loadThread(true);
    };
    const onBlur = () => {
      focused.current = false;
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    const id = window.setInterval(() => {
      if (focused.current && document.visibilityState === "visible") {
        void loadThread(true);
      }
    }, POLL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.clearInterval(id);
    };
  }, [loadThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const text = body.trim();
    if (!text && !image) return;

    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      if (text) form.set("body", text);
      if (image) form.set("image", image);

      const res = await fetch("/api/support/messages", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        message?: SupportMessage;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not send message.");
        return;
      }
      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message!.id)
            ? prev
            : [...prev, data.message!],
        );
      }
      setBody("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
      void loadThread(true);
    } catch {
      setError("Could not send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <p className="py-16 text-center text-[14px] text-kay-muted">
        Loading conversation…
      </p>
    );
  }

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
      <div className="border-b border-kay-border-light px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
          Kay Support
        </p>
        <h1 className="mt-1 font-serif text-[22px] text-kay-fg">
          Message our team
        </h1>
        <p className="mt-1 text-[13px] text-kay-muted">
          We typically reply within one business day. You can attach a photo if
          it helps.
        </p>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-kay-muted">
            Start the conversation — tell us how we can help.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderRole !== "admin";
            return (
              <div
                key={message.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    mine
                      ? "bg-kay-accent text-kay-accent-fg"
                      : "bg-kay-surface text-kay-fg"
                  }`}
                >
                  {!mine && (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                      Kay Support
                    </p>
                  )}
                  {message.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={message.imageUrl}
                      alt="Attachment"
                      className="mb-2 max-h-56 w-full rounded-lg object-cover"
                    />
                  )}
                  {message.body && (
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? "text-kay-accent-fg/70" : "text-kay-subtle"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="border-t border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={sendMessage}
        className="border-t border-kay-border-light bg-kay-surface px-4 py-3"
      >
        {previewUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected"
              className="h-14 w-14 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-[12px] text-kay-muted hover:text-kay-fg"
            >
              Remove image
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-kay-border-light text-kay-muted transition-colors hover:text-kay-fg"
            aria-label="Attach image"
          >
            <IconUpload className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImage(file);
            }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder={
              thread ? "Write a message…" : "Write your first message…"
            }
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-kay-border-light bg-kay-surface-elevated px-3 py-2.5 text-[14px] text-kay-fg outline-none focus:border-kay-gold"
          />
          <button
            type="submit"
            disabled={sending || (!body.trim() && !image)}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-kay-accent px-5 text-[13px] font-medium text-kay-accent-fg disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
