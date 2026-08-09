"use client";

import Image from "next/image";
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
        <div className="ad-animate-glow mx-auto flex h-16 w-16 items-center justify-center">
          <Image
            src="/brand/icon-dark-256.png"
            alt=""
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 object-contain"
            aria-hidden
          />
        </div>

        <p className="mt-5 font-serif text-[22px] tracking-[-0.03em] text-white">
          Kay
          <span className="ml-2 align-middle text-[9px] font-sans font-medium uppercase tracking-[0.22em] text-ad-amber">
            After Dark
          </span>
        </p>

        <h2
          id="after-dark-age-title"
          className="mt-4 font-serif text-[24px] text-white sm:text-[30px]"
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
