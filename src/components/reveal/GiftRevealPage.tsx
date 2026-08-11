"use client";

import { useEffect, useState } from "react";
import { RevealPlayer } from "@/components/reveal/RevealPlayer";

type Props = { token: string };

type Payload = {
  reveal: {
    note: string | null;
    hasVideo: boolean;
    hasPhoto: boolean;
    hasContent: boolean;
    videoUrl: string | null;
    photoUrl: string | null;
  };
  senderName: string | null;
  anonymous: boolean;
  recipientName: string | null;
};

export function GiftRevealPage({ token }: Props) {
  const [phase, setPhase] = useState<"intro" | "content" | "error">("intro");
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/reveal/${token}`);
        const json = (await res.json()) as Payload & { error?: string };
        if (!res.ok) {
          if (!cancelled) {
            setError(json.error || "This Reveal could not be found.");
            setPhase("error");
          }
          return;
        }
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) {
          setError("Something went wrong.");
          setPhase("error");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (phase !== "intro" || !data) return;
    const id = window.setTimeout(() => setPhase("content"), 2200);
    return () => window.clearTimeout(id);
  }, [phase, data]);

  if (phase === "error") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <p className="font-serif text-[28px] text-kay-fg">Reveal unavailable</p>
        <p className="mt-3 text-[14px] text-kay-muted">{error}</p>
      </div>
    );
  }

  if (phase === "intro" || !data) {
    return (
      <div className="reveal-intro relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#111111] via-[#1a1612] to-[#0c0c0c] px-4 text-center text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,154,106,0.18),transparent_60%)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/icon-512.png"
          alt="Kay"
          className="relative h-20 w-20 animate-pulse drop-shadow-[0_0_24px_rgba(184,154,106,0.45)]"
        />
        <p className="relative mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-kay-gold">
          Kay Reveal
        </p>
        <p className="relative mt-3 font-serif text-[28px] text-white/95 sm:text-[34px]">
          Something personal awaits
        </p>
      </div>
    );
  }

  const fromLine = data.anonymous
    ? "A gift for you"
    : data.senderName
      ? `From ${data.senderName}`
      : "A gift for you";

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/icon-512.png"
          alt="Kay"
          className="mx-auto h-12 w-12"
        />
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-kay-gold">
          Kay Reveal
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg">{fromLine}</h1>
        {data.recipientName && (
          <p className="mt-2 text-[14px] text-kay-muted">
            For {data.recipientName}
          </p>
        )}
      </div>

      <div className="mt-10">
        {data.reveal.hasContent ? (
          <RevealPlayer
            note={data.reveal.note}
            videoUrl={data.reveal.videoUrl}
            photoUrl={data.reveal.photoUrl}
          />
        ) : (
          <p className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-5 py-10 text-center text-[14px] text-kay-muted">
            Your gift is on its way with white-glove care. The sender hasn&apos;t
            added a video or photo yet — check back after you open the box.
          </p>
        )}
      </div>
    </div>
  );
}
