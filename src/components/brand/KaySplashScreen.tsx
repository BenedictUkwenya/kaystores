"use client";

import { useEffect, useRef, useState } from "react";
import { markSplashDone, useBrandUI } from "@/providers/BrandUIProvider";

/** Bump when choreography / timing changes so sessions re-see the intro. */
const SPLASH_KEY = "kay-splash-seen-v5";

/** Total on-screen time before the site is revealed (ms). */
const SPLASH_MS = 14_000;
const EXIT_MS = 11_500;
const HOLD_MS = 9_000;

type Phase = "enter" | "hold" | "exit";

/**
 * Cinematic first-visit intro — slow compose, long hold, then panels part.
 */
export function KaySplashScreen() {
  const { splashDone } = useBrandUI();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("enter");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (splashDone) return;

    let skip = false;
    try {
      skip = sessionStorage.getItem(SPLASH_KEY) === "1";
    } catch {
      skip = true;
    }

    if (skip) {
      document.documentElement.removeAttribute("data-splash");
      document.documentElement.removeAttribute("data-splash-boot");
      markSplashDone();
      return;
    }

    document.documentElement.setAttribute("data-splash", "on");
    setActive(true);
    setPhase("enter");
    requestAnimationFrame(() => {
      document.documentElement.removeAttribute("data-splash-boot");
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Still give a real beat even with reduced motion — user should see the lockup.
    const holdAt = reduce ? 4000 : HOLD_MS;
    const exitAt = reduce ? 5500 : EXIT_MS;
    const doneAt = reduce ? 7000 : SPLASH_MS;

    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [
      window.setTimeout(() => setPhase("hold"), holdAt),
      window.setTimeout(() => setPhase("exit"), exitAt),
      window.setTimeout(() => {
        try {
          sessionStorage.setItem(SPLASH_KEY, "1");
        } catch {
          /* ignore */
        }
        document.documentElement.removeAttribute("data-splash");
        markSplashDone();
        setActive(false);
      }, doneAt),
    ];

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [splashDone]);

  if (!active || splashDone) return null;

  return (
    <div
      className={`kay-splash kay-splash--${phase}`}
      role="presentation"
      aria-hidden={phase === "exit"}
    >
      <div className="kay-splash-panel kay-splash-panel--left" aria-hidden />
      <div className="kay-splash-panel kay-splash-panel--right" aria-hidden />

      <div className="kay-splash-ambient" aria-hidden />
      <div className="kay-splash-grain" aria-hidden />

      <div className="kay-splash-center">
        <div className="kay-splash-lockup">
          <div className="kay-splash-mark-stage">
            <div className="kay-splash-mark-glow" aria-hidden />
            <div className="kay-splash-mark-frame">
              <span className="kay-splash-mark" />
              <span className="kay-splash-mark-shine" aria-hidden />
            </div>
          </div>

          <div className="kay-splash-word" aria-label="Kay">
            <span className="kay-splash-letter" style={{ ["--i" as string]: 0 }}>
              a
            </span>
            <span className="kay-splash-letter" style={{ ["--i" as string]: 1 }}>
              y
            </span>
          </div>
        </div>

        <div className="kay-splash-meta">
          <span className="kay-splash-rule" aria-hidden />
          <p className="kay-splash-tag">Luxury gifting</p>
          <span className="kay-splash-rule" aria-hidden />
        </div>
      </div>

      <div className="kay-splash-footer">
        <span>Kay Stores</span>
      </div>
    </div>
  );
}
