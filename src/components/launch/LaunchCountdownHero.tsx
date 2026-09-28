"use client";

import { LAUNCH_LABEL } from "@/lib/launch";
import { FlipDigit } from "@/components/launch/FlipDigit";
import { openLaunchCountdown } from "@/components/launch/LaunchCountdown";
import { useLaunchCountdown } from "@/components/launch/useLaunchCountdown";

export function LaunchCountdownHero() {
  const state = useLaunchCountdown();
  if (state.mounted && state.launched) return null;

  return (
    <section className="kay-launch-hero">
      <div className="kay-launch-hero-glow" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-12 text-center sm:py-16">
        <p className="kay-launch-eyebrow">Grand opening</p>
        <h2 className="font-serif text-[30px] leading-tight text-kay-fg sm:text-[44px]">
          Kay Stores launches <em className="text-kay-gold">{LAUNCH_LABEL}</em>
        </h2>
        <div className="kay-launch-digits">
          <FlipDigit value={state.days} label="Days" size="md" mounted={state.mounted} />
          <span className="kay-launch-sep">:</span>
          <FlipDigit value={state.hours} label="Hours" size="md" mounted={state.mounted} />
          <span className="kay-launch-sep">:</span>
          <FlipDigit value={state.minutes} label="Minutes" size="md" mounted={state.mounted} />
          <span className="kay-launch-sep">:</span>
          <FlipDigit value={state.seconds} label="Seconds" size="md" mounted={state.mounted} />
        </div>
        <div className="kay-launch-hero-track" aria-hidden>
          <span style={{ width: `${Math.round(state.progress * 100)}%` }} />
        </div>
        <button
          type="button"
          onClick={openLaunchCountdown}
          className="inline-flex h-11 items-center rounded-full bg-kay-accent px-7 text-[13px] font-medium text-kay-accent-fg transition hover:opacity-90"
        >
          Get a launch reminder
        </button>
      </div>
    </section>
  );
}
