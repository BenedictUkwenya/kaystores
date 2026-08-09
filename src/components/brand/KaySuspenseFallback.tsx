"use client";

import { KayLoader } from "@/components/brand/KayLoader";

/** Drop-in replacement — quiet shimmer, no “Loading…” copy. */
export function KaySuspenseFallback({ label = "" }: { label?: string }) {
  return (
    <div className="flex min-h-[12rem] items-center justify-center py-10">
      <KayLoader size="md" label={label} />
    </div>
  );
}
