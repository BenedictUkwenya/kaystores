"use client";

import Link from "next/link";
import { TRIBUTE_COPY } from "@/lib/tribute";
import { useTributeActive } from "@/components/tribute/useTributeActive";
import { GoldBall } from "@/components/tribute/GoldBall";

/** A golden football that rolls along the bottom of every shop page. */
export function RollingFootball() {
  const active = useTributeActive();
  if (!active) return null;

  return (
    <div className="kay-messi-ball-track" aria-hidden={false}>
      <Link
        href="/#messi-picks"
        className="kay-messi-ball"
        aria-label={TRIBUTE_COPY.ballTooltip}
      >
        <GoldBall className="h-full w-full" />
      </Link>
      <span className="kay-messi-ball-tip" role="tooltip">
        {TRIBUTE_COPY.ballTooltip}
      </span>
    </div>
  );
}
