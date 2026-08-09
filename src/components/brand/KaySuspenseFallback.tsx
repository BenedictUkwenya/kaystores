"use client";

import { KayLoader } from "@/components/brand/KayLoader";

/** Drop-in replacement — atmospheric hold, quiet label. */
export function KaySuspenseFallback({ label = "" }: { label?: string }) {
  return (
    <div className="flex min-h-[16rem] items-center justify-center py-12">
      <KayLoader size="md" label={label} />
    </div>
  );
}
