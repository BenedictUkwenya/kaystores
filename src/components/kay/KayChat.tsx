"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { KayMark } from "@/components/kay/KayMark";
import { useTheme } from "@/providers/ThemeProvider";

const STORAGE_KEY = "kay:chat-v1";
const HIDDEN = [
  "/admin",
  "/vendor",
  "/checkout",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/handover",
  "/reveal",
  "/split",
];

const THINKING = [
  "Reading what you said",
  "Checking gifts that fit",
  "Looking at your orders",
  "Writing back",
];

type Handoff = { href: string; label: string };

type ChatMessage = {
  id: string;
  role: "user" | "kay";
  text: string;
  products?: Product[];
  featuredIds?: string[];
  note?: string | null;
  handoff?: Handoff | null;
};

function hiddenPath(pathname: string) {
  return HIDDEN.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function loadThread(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function KayChat() {
  const pathname = usePathname();
  const { isAfterDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {});

  useEffect(() => {
    setMessages(loadThread());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  }, [messages, hydrated]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setPhase((value) => (value + 1) % THINKING.length), 1500);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };
    const next = [...messages, userMessage];
    setMessages(next);
    setDraft("");
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afterDark: isAfterDark,
          messages: next.map((message) => ({ role: message.role, text: message.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reach Kay.");
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "kay",
          text: String(data.message ?? "Kay is busy right now. Send that again in a moment."),
          products: Array.isArray(data.products) ? data.products : [],
          featuredIds: Array.isArray(data.featuredIds) ? data.featuredIds : [],
          note: data.note ?? null,
          handoff: data.handoff ?? null,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "kay",
          text: err instanceof Error ? err.message : "Kay is busy right now. Send that again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  sendRef.current = send;

  useEffect(() => {
    function onOpen(event: Event) {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setOpen(true);
      if (prompt) void sendRef.current(prompt);
    }
    window.addEventListener("kay:open-chat", onOpen);
    return () => window.removeEventListener("kay:open-chat", onOpen);
  }, []);

  if (hiddenPath(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="kay-ai-launcher"
        aria-expanded={open}
        aria-label={open ? "Close Kay" : "Talk to Kay"}
      >
        <KayMark className="h-7 w-7 text-kay-gold" spin={!open} />
        <span className="hidden sm:inline">Kay</span>
      </button>

      {open && (
        <section className="kay-ai-panel" role="dialog" aria-label="Kay">
          <header className="flex items-center gap-3 border-b border-kay-border px-4 py-3">
            <KayMark className="h-8 w-8 text-kay-gold" spin={loading} />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[18px] text-kay-fg">Kay</p>
              <p className="text-[12px] text-kay-muted">Gifts, orders, and notes</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] text-kay-subtle hover:text-kay-fg"
            >
              Close
            </button>
          </header>

          <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !loading && (
              <p className="text-[14px] leading-relaxed text-kay-muted">
                Say hello, or tell me who the gift is for.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex gap-2"}
              >
                {message.role === "kay" && (
                  <KayMark className="mt-1 h-6 w-6 shrink-0 text-kay-gold" />
                )}
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-kay-accent px-3 py-2 text-[14px] text-kay-accent-fg"
                      : "min-w-0 max-w-[90%] text-[14px] leading-relaxed text-kay-fg"
                  }
                >
                  <p>{message.text}</p>
                  {message.note && (
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(message.note ?? "");
                        setCopied(message.id);
                        window.setTimeout(() => setCopied(null), 2000);
                      }}
                      className="mt-2 rounded-full border border-kay-border px-3 py-1 text-[12px] text-kay-muted"
                    >
                      {copied === message.id ? "Copied" : "Copy note"}
                    </button>
                  )}
                  {message.handoff && (
                    <Link
                      href={message.handoff.href}
                      className="mt-2 inline-flex rounded-full bg-kay-accent px-3 py-1.5 text-[12px] text-kay-accent-fg"
                    >
                      {message.handoff.label}
                    </Link>
                  )}
                  {message.products && message.products.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <li
                          key={product.id}
                          className="flex gap-2 rounded-xl border border-kay-border bg-kay-bg p-2"
                        >
                          <Link
                            href={`/products/${product.slug}`}
                            className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-kay-surface"
                          >
                            <Image
                              src={product.images[0] ?? "/images/kay-hero-luxury-box.png"}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            {message.featuredIds?.includes(product.id) && (
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-kay-gold">
                                Featured
                              </p>
                            )}
                            <Link
                              href={`/products/${product.slug}`}
                              className="block truncate text-[13px] font-medium"
                            >
                              {product.name}
                            </Link>
                            <p className="text-[12px]">{formatNaira(product.price)}</p>
                            <AddToCartButton product={product} className="mt-1 !h-8 !px-3 !text-[11px]">
                              Add to Bag
                            </AddToCartButton>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="kay-ai-thinking" role="status" aria-live="polite">
                <KayMark className="h-7 w-7 shrink-0 text-kay-gold" spin />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-kay-fg">{THINKING[phase]}</p>
                  <span className="kay-ai-travel" />
                </div>
              </div>
            )}
          </div>

          <form
            className="border-t border-kay-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Talk to Kay"
                className="h-11 flex-1 rounded-full border border-kay-border bg-kay-input-bg px-4 text-[14px] text-kay-fg outline-none"
              />
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                className="rounded-full bg-kay-accent px-4 text-[13px] font-medium text-kay-accent-fg disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

export function openKayChat(prompt?: string) {
  window.dispatchEvent(new CustomEvent("kay:open-chat", { detail: { prompt } }));
}
