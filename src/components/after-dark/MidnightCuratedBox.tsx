import Image from "next/image";
import Link from "next/link";
import { AFTER_DARK_COPY, AFTER_DARK_ROUTES } from "@/lib/after-dark/catalog";
import { AfterDarkReveal } from "@/components/after-dark/AfterDarkReveal";

export function MidnightCuratedBox() {
  return (
    <section className="relative overflow-hidden bg-black px-4 py-20 lg:px-10 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(232,162,74,0.08),transparent)]"
        aria-hidden
      />

      <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <AfterDarkReveal>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ad-amber/70">
              Members only
            </p>
            <h2 className="mt-3 font-serif text-[34px] leading-tight text-white sm:text-[42px]">
              The{" "}
              <em className="text-ad-amber not-italic">
                {AFTER_DARK_COPY.curatedTitleEmphasis}
              </em>{" "}
              Curated Box
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
              {AFTER_DARK_COPY.curatedBody}
            </p>
            <ul className="mt-8 space-y-4">
              {AFTER_DARK_COPY.curatedPerks.map((perk, i) => (
                <AfterDarkReveal key={perk} delay={i * 100}>
                  <li className="flex items-center gap-3 text-[14px] text-white/82">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ad-amber/40 bg-ad-amber/10 text-[11px] text-ad-amber">
                      ✓
                    </span>
                    {perk}
                  </li>
                </AfterDarkReveal>
              ))}
            </ul>
            <Link
              href={AFTER_DARK_ROUTES.concierge}
              className="ad-animate-cta mt-10 inline-flex h-[52px] items-center justify-center rounded-lg border-2 border-ad-amber px-10 text-[14px] font-semibold text-ad-amber transition-all hover:bg-ad-amber hover:text-black"
            >
              {AFTER_DARK_COPY.curatedCta}
            </Link>
          </div>
        </AfterDarkReveal>

        <AfterDarkReveal delay={200}>
          <div className="ad-vignette relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 ad-animate-ken-burns">
              <Image
                src="https://images.unsplash.com/photo-1586075010923-2dd457f5f2c0?w=900&h=700&fit=crop"
                alt="Discreet plain packaging for the Midnight Curated Box"
                fill
                className="object-cover brightness-[0.92]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 text-[11px] uppercase tracking-[0.14em] text-white/50">
              Plain outer shipper · No branding
            </p>
          </div>
        </AfterDarkReveal>
      </div>
    </section>
  );
}
