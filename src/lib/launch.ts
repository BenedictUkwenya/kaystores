/** Public launch moment — midnight Lagos time on Oct 11. */
export const LAUNCH_AT =
  process.env.NEXT_PUBLIC_LAUNCH_AT?.trim() || "2026-10-11T00:00:00+01:00";

/** Countdown progress starts from this moment (announcement). */
export const LAUNCH_ANNOUNCED_AT =
  process.env.NEXT_PUBLIC_LAUNCH_ANNOUNCED_AT?.trim() ||
  "2026-09-24T00:00:00+01:00";

export function launchTime(): number {
  return new Date(LAUNCH_AT).getTime();
}

export function isLaunched(now = Date.now()): boolean {
  return now >= launchTime();
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function countdownParts(now = Date.now()): CountdownParts {
  const totalMs = Math.max(0, launchTime() - now);
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

/** 0 → 1 progress from announcement to launch. */
export function launchProgress(now = Date.now()): number {
  const start = new Date(LAUNCH_ANNOUNCED_AT).getTime();
  const end = launchTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export const LAUNCH_LABEL = "Sunday, 11 October";
