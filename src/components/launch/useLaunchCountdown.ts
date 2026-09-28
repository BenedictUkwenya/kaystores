"use client";

import { useEffect, useState } from "react";
import {
  countdownParts,
  launchProgress,
  type CountdownParts,
} from "@/lib/launch";

export type LaunchCountdownState = CountdownParts & {
  mounted: boolean;
  launched: boolean;
  progress: number;
};

export function useLaunchCountdown(): LaunchCountdownState {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now == null) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 1,
      mounted: false,
      launched: false,
      progress: 0,
    };
  }

  const parts = countdownParts(now);
  return {
    ...parts,
    mounted: true,
    launched: parts.totalMs <= 0,
    progress: launchProgress(now),
  };
}
