"use client";

import { useEffect, useRef, useState } from "react";
import { useBrandUIOptional } from "@/providers/BrandUIProvider";
import { LAUNCH_LABEL } from "@/lib/launch";
import { FlipDigit } from "@/components/launch/FlipDigit";
import { LaunchCountdownModal } from "@/components/launch/LaunchCountdownModal";
import { useLaunchCountdown } from "@/components/launch/useLaunchCountdown";

export const OPEN_LAUNCH_EVENT = "kay:launch-open";

export function openLaunchCountdown() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_LAUNCH_EVENT));
  }
}

/** Global launch bar + floating pill + full-screen countdown. */
export function LaunchCountdown() {
  const brand = useBrandUIOptional();
  const state = useLaunchCountdown();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hiddenAfterLaunch, setHiddenAfterLaunch] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_LAUNCH_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LAUNCH_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(bar);
    return () => observer.disconnect();
  }, [state.mounted]);

  useEffect(() => {
    if (!state.launched) return;
    const t = window.setTimeout(() => setHiddenAfterLaunch(true), 6 * 60 * 60 * 1000);
    return () => window.clearTimeout(t);
  }, [state.launched]);

  if (hiddenAfterLaunch) return null;
  const splashDone = brand?.splashDone ?? true;

  return (
    <>
      <div
        ref={barRef}
        className={`kay-launch-bar ${splashDone ? "kay-launch-bar--in" : ""}`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="kay-launch-bar-inner"
          aria-label="Open launch countdown"
        >
          <span className="kay-launch-bar-shimmer" aria-hidden />
          <span className="kay-launch-bar-text">
            <span className="kay-launch-dot" aria-hidden />
            {state.launched ? (
              <>Kay is live — shop the launch collection</>
            ) : (
              <>
                <span className="hidden sm:inline">Kay Stores launches </span>
                <span className="sm:hidden">Launch </span>
                <strong>{LAUNCH_LABEL}</strong>
              </>
            )}
          </span>
          {!state.launched && (
            <span className="kay-launch-bar-digits">
              <FlipDigit value={state.days} label="d" size="sm" mounted={state.mounted} />
              <FlipDigit value={state.hours} label="h" size="sm" mounted={state.mounted} />
              <FlipDigit value={state.minutes} label="m" size="sm" mounted={state.mounted} />
              <FlipDigit value={state.seconds} label="s" size="sm" mounted={state.mounted} />
            </span>
          )}
          <span className="kay-launch-bar-cta" aria-hidden>
            {state.launched ? "Celebrate" : "Remind me"} →
          </span>
        </button>
      </div>

      {splashDone && state.mounted && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`kay-launch-pill ${collapsed && !open ? "kay-launch-pill--show" : ""}`}
          aria-label="Open launch countdown"
          tabIndex={collapsed ? 0 : -1}
        >
          <svg viewBox="0 0 36 36" className="kay-launch-pill-ring" aria-hidden>
            <circle cx="18" cy="18" r="15.5" className="kay-launch-pill-track" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              className="kay-launch-pill-progress"
              strokeDasharray={`${state.progress * 97.4} 97.4`}
            />
          </svg>
          <span className="kay-launch-pill-text">
            {state.launched ? (
              "Live"
            ) : (
              <>
                <strong>{state.days}</strong>d{" "}
                {String(state.hours).padStart(2, "0")}:
                {String(state.minutes).padStart(2, "0")}:
                {String(state.seconds).padStart(2, "0")}
              </>
            )}
          </span>
        </button>
      )}

      <LaunchCountdownModal open={open} onClose={() => setOpen(false)} state={state} />
    </>
  );
}
