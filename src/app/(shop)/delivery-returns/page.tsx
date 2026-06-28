import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";
import {
  DELIVERY_SECTIONS,
  RETURNS_SECTIONS,
} from "@/lib/data/site-content";

export const metadata: Metadata = {
  title: "Delivery & Returns",
  description: "Kay Stores delivery promise, white-glove logistics, quality checks, and returns policy.",
};

export default function DeliveryReturnsPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Help", href: "/faqs" },
        { label: "Delivery & Returns" },
      ]}
      eyebrow="Help centre"
      title="Delivery & returns"
      description="White-glove delivery within 72 hours. Every item vetted at our hub before it reaches you or your recipient."
    >
      {DELIVERY_SECTIONS.map((section) => (
        <ContentSection key={section.title} title={section.title}>
          {"body" in section && (
            <ContentProse>
              <p>{section.body}</p>
            </ContentProse>
          )}
          {"steps" in section && (
            <ol className="space-y-3">
              {section.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-4 text-[14px] leading-relaxed text-kay-muted"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kay-gold-light/70 text-[11px] font-semibold text-kay-gold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </ContentSection>
      ))}

      <ContentSection title="Returns">
        <div className="space-y-6">
          {RETURNS_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium text-kay-fg">{section.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-kay-muted">
                {section.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[14px] text-kay-muted">
          To start a return,{" "}
          <Link href="/contact" className="font-medium text-kay-gold hover:underline">
            contact us
          </Link>{" "}
          with your order reference.
        </p>
      </ContentSection>
    </ContentPageLayout>
  );
}
