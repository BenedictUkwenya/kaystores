import Image from "next/image";
import Link from "next/link";
import { HERO_TRUST_BADGES } from "@/lib/data/home";
import { IconArrowRight, IconDiamond, IconSparkle, TrustIcon } from "@/components/ui/Icons";

export function HeroSection() {
  return (
    <section className="overflow-hidden bg-kay-bg">
      <div className="grid lg:min-h-[calc(100vh-60px)] lg:grid-cols-2 lg:grid-rows-1 lg:items-stretch">
        {/* Left — 50% */}
        <div className="relative z-10 flex min-w-0 flex-col justify-start overflow-hidden px-8 pb-12 pt-8 sm:px-12 sm:pt-10 lg:px-16 lg:pb-16 lg:pt-10 xl:px-24 2xl:pl-[max(6rem,calc((100vw-1440px)/2+4rem))]">
          <div className="max-w-[520px]">
            <h1 className="font-serif text-[42px] leading-[1.12] tracking-[-0.01em] text-kay-fg sm:text-[48px] lg:text-[54px] xl:text-[58px]">
              Thoughtful gifts.
              <br />
              Beautifully curated.
            </h1>

            <p className="mt-5 max-w-[400px] text-[15px] leading-[1.65] text-kay-muted">
              Discover luxury gifts for every occasion, chosen with love, delivered
              with care.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/gifts"
                className="inline-flex h-[46px] items-center gap-2.5 rounded-full bg-kay-accent px-7 text-[14px] font-medium text-kay-accent-fg shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:brightness-110"
              >
                Shop Gifts
                <IconArrowRight className="opacity-90" />
              </Link>
              <Link
                href="#ai-concierge"
                className="inline-flex h-[46px] items-center gap-2 rounded-full border border-kay-fg bg-transparent px-7 text-[14px] font-medium text-kay-fg transition-all hover:-translate-y-0.5 hover:bg-kay-surface hover:shadow-sm"
              >
                Find the Perfect Gift
                <IconSparkle className="text-kay-gold" />
              </Link>
              <Link
                href="/concierge"
                className="inline-flex h-[46px] items-center gap-2 rounded-full border border-kay-gold bg-transparent px-7 text-[14px] font-medium text-kay-gold transition-all hover:-translate-y-0.5 hover:bg-kay-gold-light/40 hover:shadow-sm"
              >
                Concierge Sourcing
                <IconDiamond className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 lg:mt-14 lg:gap-x-8">
              {HERO_TRUST_BADGES.map((badge) => (
                <div key={badge.label} className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kay-gold-light">
                    <TrustIcon
                      name={badge.icon}
                      className="h-3.5 w-3.5 text-kay-gold"
                    />
                  </div>
                  <span className="text-[11px] leading-tight text-kay-muted lg:text-[12px]">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — full 50%, edge to edge */}
        <div className="hero-image relative min-h-[380px] w-full bg-kay-bg sm:min-h-[440px] lg:min-h-0 lg:flex-1">
          <Image
            src="/images/kay-hero-luxury-box.png"
            alt="Kay luxury gift box with branded ribbon on cream silk"
            fill
            priority
            unoptimized
            className="object-contain object-center"
            sizes="50vw"
          />
        </div>
      </div>
    </section>
  );
}
