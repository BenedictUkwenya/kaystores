import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentSection,
} from "@/components/content/ContentPageLayout";
import { FAQAccordion } from "@/components/content/FAQAccordion";
import { FAQ_ITEMS } from "@/lib/data/site-content";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Frequently asked questions about Kay Stores — gifting, AI, privacy, delivery, and returns.",
};

export default function FAQsPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Help", href: "/faqs" },
        { label: "FAQs" },
      ]}
      eyebrow="Help centre"
      title="Frequently asked questions"
      description="Everything you need to know about Kay AI, comparison, concierge sourcing, After Dark privacy, and delivery."
    >
      <FAQAccordion items={FAQ_ITEMS} />

      <ContentSection>
        <p className="text-[14px] text-kay-muted">
          Still have questions?{" "}
          <Link href="/contact" className="font-medium text-kay-gold hover:underline">
            Contact our team
          </Link>{" "}
          or browse{" "}
          <Link href="/delivery-returns" className="font-medium text-kay-gold hover:underline">
            Delivery &amp; Returns
          </Link>
          .
        </p>
      </ContentSection>
    </ContentPageLayout>
  );
}
