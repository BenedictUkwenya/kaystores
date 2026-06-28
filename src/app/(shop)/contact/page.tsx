import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentSection,
} from "@/components/content/ContentPageLayout";
import { ContactForm } from "@/components/content/ContactForm";
import { CONTACT_CHANNELS } from "@/lib/data/site-content";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Kay Stores team — gifting support, orders, and enquiries.",
};

export default function ContactPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Help", href: "/faqs" },
        { label: "Contact Us" },
      ]}
      eyebrow="Help centre"
      title="Contact us"
      description="Our concierge team responds within one business day. For special sourcing, use the Concierge form."
    >
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          {CONTACT_CHANNELS.map((channel) => (
            <div
              key={channel.label}
              className="rounded-xl border border-kay-border-light bg-kay-surface-elevated p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
                {channel.label}
              </p>
              {channel.href.startsWith("/") ? (
                <Link
                  href={channel.href}
                  className="mt-1 block text-[14px] font-medium text-kay-gold hover:underline"
                >
                  {channel.value}
                </Link>
              ) : (
                <a
                  href={channel.href}
                  className="mt-1 block text-[14px] font-medium text-kay-fg hover:text-kay-gold"
                >
                  {channel.value}
                </a>
              )}
            </div>
          ))}
        </aside>

        <ContentSection title="Send a message">
          <ContactForm />
        </ContentSection>
      </div>
    </ContentPageLayout>
  );
}
