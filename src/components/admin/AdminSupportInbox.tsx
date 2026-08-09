"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  SupportMessage,
  SupportThreadListItem,
} from "@/types/support";
import { IconUpload } from "@/components/ui/Icons";

const POLL_MS = 5000;

export function AdminSupportInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("thread");

  const [threads, setThreads] = useState<SupportThreadListItem[]>([]);
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

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId],
  );

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support");
      const data = (await res.json()) as {
        threads?: SupportThreadListItem[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not load threads.");
        return;
      }
      setThreads(data.threads ?? []);
      setError(null);
    } catch {
      setError("Could not load threads.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/admin/support/${threadId}`);
      const data = (await res.json()) as {
        messages?: SupportMessage[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not load messages.");
        return;
      }
      setMessages(data.messages ?? []);
    } catch {
      setError("Could not load messages.");
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedId) void loadMessages(selectedId);
    else setMessages([]);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    const onFocus = () => {
      focused.current = true;
      void loadThreads();
      if (selectedId) void loadMessages(selectedId);
    };
    const onBlur = () => {
      focused.current = false;
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    const id = window.setInterval(() => {
      if (focused.current && document.visibilityState === "visible") {
        void loadThreads();
        if (selectedId) void loadMessages(selectedId);
      }
    }, POLL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.clearInterval(id);
    };
  }, [loadThreads, loadMessages, selectedId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function selectThread(id: string) {
    router.replace(`/admin/support?thread=${id}`);
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || sending) return;
    const text = body.trim();
    if (!text && !image) return;

    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      if (text) form.set("body", text);
      if (image) form.set("image", image);

      const res = await fetch(`/api/admin/support/${selectedId}`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        message?: SupportMessage;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not send reply.");
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
      void loadThreads();
    } catch {
      setError("Could not send reply.");
    } finally {
      setSending(false);
    }
  }

  async function closeThread() {
    if (!selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ close: true }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Could not close thread.");
        return;
      }
      void loadThreads();
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-[14px] text-kay-muted">
        Loading inbox…
      </p>
    );
  }

  return (
    <div className="grid min-h-[min(70vh,720px)] overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)] lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-kay-border-light lg:border-b-0 lg:border-r">
        <div className="border-b border-kay-border-light px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
            Inbox
          </p>
        </div>
        <ul className="max-h-[40vh] overflow-y-auto lg:max-h-[calc(70vh-48px)]">
          {threads.length === 0 ? (
            <li className="px-4 py-8 text-[13px] text-kay-muted">
              No support threads yet.
            </li>
          ) : (
            threads.map((thread) => {
              const active = thread.id === selectedId;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => selectThread(thread.id)}
                    className={`w-full border-b border-kay-border-light px-4 py-3 text-left transition-colors ${
                      active
                        ? "bg-kay-surface"
                        : "hover:bg-kay-surface/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-kay-fg">
                        {thread.userName || thread.userEmail || "Customer"}
                      </span>
                      {thread.needsAttention && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-kay-gold" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-kay-muted">
                      {thread.lastPreview || "No messages"}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-kay-subtle">
                      {thread.status}
                      {" · "}
                      {new Date(thread.lastMessageAt).toLocaleString()}
                    </p>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section className="flex min-h-[420px] flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-[14px] text-kay-muted">
            Select a conversation to reply.
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-kay-border-light px-5 py-4">
              <div>
                <h2 className="font-serif text-[20px] text-kay-fg">
                  {selected.userName || "Customer"}
                </h2>
                <p className="mt-0.5 text-[13px] text-kay-muted">
                  {selected.userEmail || selected.userId}
                </p>
              </div>
              {selected.status === "open" && (
                <button
                  type="button"
                  onClick={() => void closeThread()}
                  disabled={sending}
                  className="rounded-lg border border-kay-border-light px-3 py-1.5 text-[12px] text-kay-muted hover:text-kay-fg"
                >
                  Close
                </button>
              )}
            </div>

            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((message) => {
                const mine = message.senderRole === "admin";
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
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                        {mine ? "You" : message.senderRole}
                      </p>
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
              })}
            </div>

            {error && (
              <p className="border-t border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
                {error}
              </p>
            )}

            <form
              onSubmit={sendReply}
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
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={2}
                  placeholder="Write a reply…"
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-kay-border-light bg-kay-surface-elevated px-3 py-2.5 text-[14px] text-kay-fg outline-none focus:border-kay-gold"
                />
                <button
                  type="submit"
                  disabled={sending || (!body.trim() && !image)}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-kay-accent px-5 text-[13px] font-medium text-kay-accent-fg disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Reply"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
