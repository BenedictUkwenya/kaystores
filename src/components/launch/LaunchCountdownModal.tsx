"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { LAUNCH_LABEL } from "@/lib/launch";
import { FlipDigit } from "@/components/launch/FlipDigit";
import type { LaunchCountdownState } from "@/components/launch/useLaunchCountdown";

type Props = {
  open: boolean;
  onClose: () => void;
  state: LaunchCountdownState;
};

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.53) % 8,
  duration: 7 + ((i * 1.7) % 6),
  size: 2 + (i % 4),
}));

const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 23) % 100,
  delay: (i * 0.09) % 1.8,
  rotate: (i * 47) % 360,
  hue: i % 3,
}));

export function LaunchCountdownModal({ open, onClose, state }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  async function subscribe(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/launch/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save your email.");
      setStatus("done");
      setMessage("You're on the list — we'll email you the moment Kay goes live.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save your email.");
    }
  }

  const circumference = 2 * Math.PI * 140;

  return createPortal(
    <div
      className="kay-launch-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Kay Stores launch countdown"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * -10;
        setTilt({ x, y });
      }}
    >
      <div className="kay-launch-modal-bg" onClick={onClose} aria-hidden />
      <div className="kay-launch-particles" aria-hidden>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {state.launched && (
        <div className="kay-launch-confetti" aria-hidden>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className={`kay-confetti-${c.hue}`}
              style={{
                left: `${c.left}%`,
                animationDelay: `${c.delay}s`,
                transform: `rotate(${c.rotate}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="kay-launch-close"
        aria-label="Close countdown"
      >
        ×
      </button>

      <div
        className="kay-launch-stage"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        }}
      >
        <svg viewBox="0 0 300 300" className="kay-launch-ring" aria-hidden>
          <defs>
            <linearGradient id="kayLaunchGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e8d3a8" />
              <stop offset="50%" stopColor="#b89a6a" />
              <stop offset="100%" stopColor="#8a6d3f" />
            </linearGradient>
          </defs>
          <circle cx="150" cy="150" r="140" className="kay-launch-ring-track" />
          <circle
            cx="150"
            cy="150"
            r="140"
            className="kay-launch-ring-progress"
            stroke="url(#kayLaunchGold)"
            strokeDasharray={`${state.progress * circumference} ${circumference}`}
          />
        </svg>

        <p className="kay-launch-eyebrow">
          {state.launched ? "We're live" : "The wait is almost over"}
        </p>
        <h2 className="kay-launch-title">
          {state.launched ? (
            <>Kay Stores is open</>
          ) : (
            <>
              Kay Stores launches
              <br />
              <em>{LAUNCH_LABEL}</em>
            </>
          )}
        </h2>

        {!state.launched && (
          <div className="kay-launch-digits">
            <FlipDigit value={state.days} label="Days" size="lg" mounted={state.mounted} />
            <span className="kay-launch-sep">:</span>
            <FlipDigit value={state.hours} label="Hours" size="lg" mounted={state.mounted} />
            <span className="kay-launch-sep">:</span>
            <FlipDigit value={state.minutes} label="Minutes" size="lg" mounted={state.mounted} />
            <span className="kay-launch-sep">:</span>
            <FlipDigit value={state.seconds} label="Seconds" size="lg" mounted={state.mounted} />
          </div>
        )}

        <p className="kay-launch-copy">
          {state.launched
            ? "Luxury gifting, Kay Kitchen treats and concierge requests — all open now."
            : "Curated luxury gifts, Kay Kitchen cakes, and a concierge that finds anything. Be first through the door."}
        </p>

        {state.launched ? (
          <a href="/gifts" className="kay-launch-submit" onClick={onClose}>
            Start shopping
          </a>
        ) : status === "done" ? (
          <p className="kay-launch-success">{message}</p>
        ) : (
          <form onSubmit={subscribe} className="kay-launch-form">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="kay-launch-input"
              aria-label="Email for launch reminder"
            />
            <button type="submit" className="kay-launch-submit" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Remind me at launch"}
            </button>
          </form>
        )}
        {status === "error" && <p className="kay-launch-error">{message}</p>}
        {!state.launched && state.mounted && (
          <p className="kay-launch-progress-label">
            {Math.round(state.progress * 100)}% of the way to launch
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
