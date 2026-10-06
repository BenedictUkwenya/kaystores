"use client";

import { useEffect, useState } from "react";
import { useBrandUI } from "@/providers/BrandUIProvider";
import { TRIBUTE_COPY } from "@/lib/tribute";
import { useTributeActive } from "@/components/tribute/useTributeActive";
import { GoldBall } from "@/components/tribute/GoldBall";

const SEEN_KEY = "kay:messi-intro-seen-v1";
const RUN_MS = 4300;
const RUN_REDUCED_MS = 2700;

/** One-time "Thank you, Messi" moment, right after the Kay splash. */
export function MessiIntro() {
  const active = useTributeActive();
  const { splashDone } = useBrandUI();
  const [show, setShow] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (!active || !splashDone) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "1") return;
    } catch {
      return;
    }
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = window.requestAnimationFrame(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      setReduce(prefersReduce);
      setShow(true);
    });
    const id = window.setTimeout(
      () => setShow(false),
      prefersReduce ? RUN_REDUCED_MS : RUN_MS,
    );
    return () => {
      window.cancelAnimationFrame(start);
      window.clearTimeout(id);
    };
  }, [active, splashDone]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setShow(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`kay-messi-intro${reduce ? " kay-messi-intro--reduce" : ""}`}
      role="presentation"
      onClick={() => setShow(false)}
    >
      <div className="kay-messi-intro-stripes kay-messi-stripes" aria-hidden />
      <div className="kay-messi-intro-ten" aria-hidden>
        10
      </div>
      <div className="kay-messi-intro-words" aria-live="polite">
        <span>{TRIBUTE_COPY.spanish}</span>
        <span>{TRIBUTE_COPY.headline}</span>
      </div>
      <GoldBall className="kay-messi-intro-ball" />
      <span className="kay-messi-intro-skip">Tap to skip</span>
    </div>
  );
}
