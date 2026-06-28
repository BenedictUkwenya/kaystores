import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";
import {
  ABOUT_LUXURY_STANDARDS,
  ABOUT_PILLARS,
} from "@/lib/data/site-content";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Kay Stores — luxury gifting with intelligent curation, comparison, concierge sourcing, and absolute discretion.",
};

export default function AboutPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Our Story" },
      ]}
      eyebrow="About Kay"
      title="Convenience, privacy, and luxury — by design"
      description="Kay was built for people who want to show up thoughtfully for the people who matter — without the stress of sourcing, packaging, or delivery."
    >
      <ContentSection>
        <ContentProse>
          <p>
            Kay is an e-commerce platform specialising in gifting and discreet
            wellness. Whether you&apos;re sending a curated gift to a client, a
            loved one, or ordering with full privacy, Kay handles curation,
            packaging, and white-glove delivery — so your intentions are clear
            without going out on a limb to express them.
          </p>
          <p>
            We serve busy, high-net-worth individuals who value time, taste, and
            discretion. From corporate gifting to personal celebrations — and
            our confidential After Dark collection — every order is treated as a
            luxury experience, not a transaction.
          </p>
        </ContentProse>
      </ContentSection>

      <ContentSection title="What Kay offers">
        <ul className="grid gap-4 sm:grid-cols-2">
          {ABOUT_PILLARS.map((pillar) => (
            <li
              key={pillar.title}
              className="rounded-xl border border-kay-border-light bg-kay-bg/60 p-5"
            >
              <h3 className="font-serif text-[18px] text-kay-fg">
                {pillar.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-kay-muted">
                {pillar.description}
              </p>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection title="Luxury standards">
        <ul className="space-y-5">
          {ABOUT_LUXURY_STANDARDS.map((standard) => (
            <li key={standard.title} className="flex gap-4">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-kay-gold" />
              <div>
                <h3 className="font-medium text-kay-fg">{standard.title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-kay-muted">
                  {standard.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection title="How we source">
        <ContentProse>
          <p>
            Every product on Kay comes from a curated network of verified
            vendors — handpicked for quality, not volume. Vendors update stock
            daily, and every item passes a 3-point inspection at our hub before
            it reaches you.
          </p>
          <p>
            Can&apos;t find what you need?{" "}
            <Link href="/concierge" className="text-kay-gold hover:underline">
              Concierge Sourcing
            </Link>{" "}
            exists so nothing is impossible to get on Kay.
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
