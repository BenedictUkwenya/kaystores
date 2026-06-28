"use client";

import { IconShield } from "@/components/ui/Icons";

export function SatisfactionBanner() {
  return (
    <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <IconShield className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-emerald-900">
            100% Satisfaction Guaranteed
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-emerald-700/80">
            30-day effortless return policy on eligible luxury gifts.
          </p>
        </div>
      </div>
    </div>
  );
}
