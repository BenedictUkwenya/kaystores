import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";
import { TrackConciergeForm } from "@/components/concierge/TrackConciergeForm";

export const metadata: Metadata = {
  title: "Track Concierge Request",
  description: "Check the status of your Kay Stores concierge sourcing request.",
};

export default function TrackConciergePage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Concierge", href: "/concierge" },
        { label: "Track Request" },
      ]}
      eyebrow="Concierge"
      title="Track your sourcing request"
      description="Enter your reference number and email — no account required."
    >
      <ContentSection>
        <TrackConciergeForm />
        <ContentProse>
          <p className="mt-6 text-[13px]">
            Just submitted a request? Your reference appears on the confirmation
            screen. Need help?{" "}
            <Link href="/contact" className="text-kay-gold hover:underline">
              Contact concierge
            </Link>
            .
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
