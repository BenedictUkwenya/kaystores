"use client";

import Link from "next/link";
import { AFTER_DARK_COPY } from "@/lib/after-dark/catalog";
import { useAfterDarkAge } from "@/components/after-dark/AfterDarkAgeProvider";

export function AfterDarkAgeGate() {
  const { verified, confirm, mounted } = useAfterDarkAge();

  if (!mounted || verified) return null;

  return (
    <div
      className="ad-animate-backdrop fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-xl sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="after-dark-age-title"
    >
      <div className="ad-animate-modal my-auto w-full max-w-md rounded-2xl border border-ad-amber/20 bg-[#111111] px-6 py-8 text-center shadow-[0_0_80px_-12px_rgba(232,162,74,0.35)] sm:px-8 sm:py-10">
        <div className="ad-animate-glow mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ad-amber/50 text-ad-amber">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M12 3v18M3 12h18" strokeLinecap="round" />
            <path d="M7 7l10 10M17 7L7 17" strokeLinecap="round" opacity="0.5" />
          </svg>
        </div>

        <h2
          id="after-dark-age-title"
          className="mt-6 font-serif text-[24px] text-white sm:text-[30px]"
        >
          {AFTER_DARK_COPY.ageGateTitle}
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-white/60">
          {AFTER_DARK_COPY.ageGateBody}
        </p>

        <button
          type="button"
          onClick={confirm}
          className="ad-animate-cta mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-ad-amber text-[14px] font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {AFTER_DARK_COPY.ageGateConfirm}
        </button>
        <Link
          href="/"
          className="mt-3 flex h-12 w-full items-center justify-center rounded-lg border border-white/12 text-[14px] font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white"
        >
          {AFTER_DARK_COPY.ageGateExit}
        </Link>
      </div>
    </div>
  );
}
