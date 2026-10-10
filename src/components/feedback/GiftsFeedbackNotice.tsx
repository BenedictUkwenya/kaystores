"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "kay:gifts-feedback-notice-hidden";

export function GiftsFeedbackNotice() {
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden !== false) return null;

  function dismiss() {
    setLeaving(true);
    window.setTimeout(() => {
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        /* stay dismissed for this view */
      }
      setHidden(true);
    }, 280);
  }

  return (
    <aside className={`kay-fb-gifts ${leaving ? "is-out" : ""}`} aria-label="Share your feedback">
      <p className="kay-fb-gifts-kicker">While you browse</p>
      <p className="kay-fb-gifts-title">Share your feedback…</p>
      <p className="kay-fb-gifts-copy">
        An idea, a bug, or a gift you loved. It takes a minute, and other shoppers can vote for it.
      </p>
      <Link href="/feedback" className="kay-fb-primary kay-fb-gifts-cta">
        Open the board
      </Link>
      <button type="button" className="kay-fb-gifts-x" aria-label="Dismiss feedback notice" onClick={dismiss}>
        <svg viewBox="0 0 16 16" aria-hidden>
          <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  );
}
