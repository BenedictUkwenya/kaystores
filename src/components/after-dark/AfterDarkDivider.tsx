import type { CSSProperties } from "react";

export function AfterDarkDivider() {
  return (
    <div
      className="relative flex items-center justify-center gap-5 bg-black py-10"
      aria-hidden
    >
      <div
        className="ad-animate-line h-px w-24 bg-gradient-to-r from-transparent to-ad-amber/50 sm:w-40"
        style={{ "--ad-delay": "200ms" } as CSSProperties}
      />
      <span className="ad-animate-fade-in text-[10px] text-ad-amber/40">◆</span>
      <div
        className="ad-animate-line h-px w-24 bg-gradient-to-l from-transparent to-ad-amber/50 sm:w-40"
        style={{ "--ad-delay": "200ms" } as CSSProperties}
      />
    </div>
  );
}
