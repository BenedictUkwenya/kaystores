"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "kay:feedback-nudge-hidden";

export function FeedbackNudge() {
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden !== false) return null;

  return (
    <div className="kay-fb-nudge">
      <p className="relative font-serif text-[22px] text-kay-fg">Tell Kay what you think</p>
      <p className="relative mt-1 max-w-md text-[13px] leading-relaxed text-kay-muted">
        An idea, a bug, or something you loved. It takes a minute, and other shoppers can vote for it.
      </p>
      <Link href="/feedback" className="kay-fb-primary relative mt-4">
        Open the board
      </Link>
      <button
        type="button"
        className="absolute right-3 top-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-kay-subtle"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* keep it closed for this view */
          }
          setHidden(true);
        }}
      >
        Hide
      </button>
    </div>
  );
}
