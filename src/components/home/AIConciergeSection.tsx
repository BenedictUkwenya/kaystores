"use client";

import { AI_SUGGESTIONS } from "@/lib/data/home";
import { openKayChat } from "@/components/kay/KayChat";
import { useTheme } from "@/providers/ThemeProvider";

export function AIConciergeSection() {
  const { isAfterDark } = useTheme();

  return (
    <section id="ai-concierge" className="bg-kay-bg px-4 py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="rounded-2xl bg-kay-surface px-6 py-8 lg:px-10 lg:py-10">
          <div className="lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-10">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-[22px] text-kay-fg lg:text-[26px]">
                  Let Kay AI find the perfect gift
                </h2>
                <span className="rounded bg-kay-beta-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-kay-beta">
                  Beta
                </span>
              </div>
              <p className="mt-3 max-w-[320px] text-[14px] leading-relaxed text-kay-muted">
                Tell us about the person and the occasion, and we&apos;ll suggest
                something they&apos;ll love.
              </p>
              {isAfterDark && (
                <p className="mt-2 text-[12px] text-kay-gold">
                  After Dark — prioritising exclusive & night collection picks
                </p>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => openKayChat()}
                className="inline-flex h-12 items-center rounded-full bg-kay-accent px-6 text-[14px] font-medium text-kay-accent-fg"
              >
                Talk to Kay
              </button>
              <div className="mt-4 flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => openKayChat(suggestion)}
                    className="rounded-full border border-kay-border bg-kay-surface-elevated px-4 py-2 text-[12px] text-kay-muted transition-colors hover:border-kay-fg hover:text-kay-fg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
