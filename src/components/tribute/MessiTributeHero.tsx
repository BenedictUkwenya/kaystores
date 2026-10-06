import Image from "next/image";
import Link from "next/link";
import { HERO_TRUST_BADGES } from "@/lib/data/home";
import { MESSI_QUOTES, TRIBUTE_COPY } from "@/lib/tribute";
import { IconArrowRight, IconSparkle, TrustIcon } from "@/components/ui/Icons";
import { GoldBall } from "@/components/tribute/GoldBall";

const DRIFTING_TENS = [
  { left: "8%", top: "70%", delay: "0s" },
  { left: "22%", top: "85%", delay: "3s" },
  { left: "78%", top: "78%", delay: "1.5s" },
  { left: "88%", top: "60%", delay: "5s" },
  { left: "50%", top: "90%", delay: "7s" },
];

export function MessiTributeHero() {
  const quote = MESSI_QUOTES[0];
  return (
    <section className="overflow-hidden bg-kay-bg">
      <div className="grid lg:min-h-[calc(100vh-60px)] lg:grid-cols-2 lg:items-stretch">
        <div className="relative z-10 flex min-w-0 flex-col justify-center px-4 pb-12 pt-10 sm:px-12 lg:px-16 lg:py-16 xl:px-24 2xl:pl-[max(6rem,calc((100vw-1440px)/2+4rem))]">
          <div className="max-w-[560px]">
            <p className="kay-messi-eyebrow">{TRIBUTE_COPY.eyebrow}</p>
            <h1 className="mt-5 font-serif text-[40px] leading-[1.05] tracking-[-0.015em] text-kay-fg sm:text-[52px] lg:text-[64px] xl:text-[72px]">
              Thank you,
              <br />
              <span className="bg-gradient-to-r from-[var(--messi-sky-deep)] via-kay-gold to-[var(--messi-sky-deep)] bg-clip-text text-transparent">
                Messi.
              </span>
            </h1>
            <p className="mt-5 max-w-[440px] text-[15px] leading-[1.65] text-kay-muted sm:text-[16px]">
              {TRIBUTE_COPY.sub} For two days, Kay Stores is sky blue and gold. Send
              someone a gift worthy of a number 10.
            </p>
            <blockquote className="mt-6 border-l-2 border-kay-gold pl-4 font-serif text-[15px] italic leading-relaxed text-kay-fg/80">
              &ldquo;{quote}&rdquo;
              <footer className="mt-1 text-[11px] not-italic uppercase tracking-[0.18em] text-kay-subtle">
                Lionel Messi
              </footer>
            </blockquote>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/#messi-picks"
                className="inline-flex h-[46px] items-center gap-2.5 rounded-full bg-kay-accent px-7 text-[14px] font-medium text-kay-accent-fg shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:brightness-110"
              >
                Shop {TRIBUTE_COPY.picksTitle}
                <IconArrowRight className="opacity-90" />
              </Link>
              <Link
                href="/gifts/occasion/thank-you"
                className="inline-flex h-[46px] items-center gap-2 rounded-full border border-[var(--messi-sky-deep)] bg-transparent px-7 text-[14px] font-medium text-[var(--messi-sky-deep)] transition-all hover:-translate-y-0.5 hover:bg-[var(--messi-sky-light)] hover:shadow-sm"
              >
                Send a thank-you gift
                <IconSparkle className="text-kay-gold" />
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 lg:gap-x-8">
              {HERO_TRUST_BADGES.map((badge) => (
                <div key={badge.label} className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kay-gold-light">
                    <TrustIcon name={badge.icon} className="h-3.5 w-3.5 text-kay-gold" />
                  </div>
                  <span className="text-[11px] leading-tight text-kay-muted lg:text-[12px]">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="kay-messi-hero-art relative min-h-[400px] w-full sm:min-h-[480px] lg:min-h-0">
          <div className="kay-messi-tens pointer-events-none absolute inset-0" aria-hidden>
            {DRIFTING_TENS.map((t) => (
              <span
                key={t.left}
                style={{ left: t.left, top: t.top, animationDelay: t.delay }}
              >
                10
              </span>
            ))}
          </div>
          <div className="absolute inset-5 overflow-hidden rounded-[28px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/5 sm:inset-10 lg:inset-14 lg:rounded-[36px]">
            <Image
              src="/images/messi/jersey-box.jpg"
              alt="A sky-blue and white number 10 jersey folded in a Kay gift box beside a golden football"
              fill
              priority
              unoptimized
              className="object-cover object-center"
              sizes="50vw"
            />
          </div>
          <GoldBall className="kay-messi-float absolute right-[8%] top-[12%] h-16 w-16 drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)] sm:h-20 sm:w-20 lg:right-[10%] lg:top-[10%]" />
        </div>
      </div>
    </section>
  );
}
