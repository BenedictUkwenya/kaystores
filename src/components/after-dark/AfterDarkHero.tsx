"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { AFTER_DARK_COPY } from "@/lib/after-dark/catalog";
import { useAfterDarkAge } from "@/components/after-dark/AfterDarkAgeProvider";

export function AfterDarkHero() {
  const { verified, confirm } = useAfterDarkAge();

  function handleEnter() {
    if (!verified) {
      confirm();
    }
    document.getElementById("selections")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="ad-vignette ad-grain relative min-h-[min(92vh,780px)] overflow-hidden bg-black">
      <div className="absolute inset-0 ad-animate-ken-burns">
        <Image
          src="/after-dark/hero.png"
          alt=""
          fill
          priority
          className="object-cover object-[center_40%] brightness-[0.88] saturate-[1.05]"
          sizes="100vw"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      <div
        className="ad-hero-glow ad-animate-glow ad-animate-ember top-[18%] right-[22%] h-48 w-48 bg-amber-500/30"
        style={{ animationDelay: "0s" }}
        aria-hidden
      />
      <div
        className="ad-hero-glow ad-animate-ember top-[32%] right-[38%] h-32 w-32 bg-orange-400/20"
        style={{ animationDelay: "1.5s" }}
        aria-hidden
      />
      <div
        className="ad-hero-glow ad-animate-glow bottom-[20%] left-[55%] h-40 w-40 bg-amber-600/15"
        style={{ animationDelay: "0.8s" }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[min(92vh,780px)] max-w-[1280px] flex-col justify-center px-4 py-20 lg:px-10">
        <p
          className="ad-animate-fade-up text-[11px] uppercase tracking-[0.28em] text-ad-amber/90"
          style={{ "--ad-delay": "120ms" } as CSSProperties}
        >
          {AFTER_DARK_COPY.viewingLabel}
        </p>

        <div
          className="ad-animate-line mt-6 h-px w-16 bg-ad-amber/60"
          style={{ "--ad-delay": "280ms" } as CSSProperties}
        />

        <h1
          className="ad-animate-fade-up mt-6 max-w-xl font-serif text-[44px] leading-[1.02] text-ad-amber sm:text-[56px] lg:text-[64px]"
          style={{ "--ad-delay": "360ms" } as CSSProperties}
        >
          {AFTER_DARK_COPY.heroTitle}
        </h1>

        <p
          className="ad-animate-fade-up mt-6 max-w-md text-[16px] leading-relaxed text-white/78 sm:text-[17px]"
          style={{ "--ad-delay": "520ms" } as CSSProperties}
        >
          {AFTER_DARK_COPY.heroSubtitle}
        </p>

        <button
          type="button"
          onClick={handleEnter}
          className="ad-animate-fade-up ad-animate-cta ad-shimmer-hover mt-10 inline-flex h-[52px] w-fit items-center justify-center rounded-lg bg-ad-amber px-12 text-[14px] font-semibold tracking-wide text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={
            {
              "--ad-delay": "680ms",
              backgroundImage:
                "linear-gradient(105deg, #e8a24a 0%, #f0c078 45%, #e8a24a 55%, #d4923f 100%)",
            } as CSSProperties
          }
        >
          {AFTER_DARK_COPY.heroCta}
        </button>

        <p
          className="ad-animate-fade-in mt-8 text-[11px] tracking-wide text-white/35"
          style={{ "--ad-delay": "900ms" } as CSSProperties}
        >
          18+ only · Discreet packaging · Anonymous delivery available
        </p>
      </div>
    </section>
  );
}
