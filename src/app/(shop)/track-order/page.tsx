import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";
import { TrackOrderForm } from "@/components/content/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track your Kay Stores order with your order reference.",
};

export default function TrackOrderPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Help", href: "/faqs" },
        { label: "Track Order" },
      ]}
      eyebrow="Help centre"
      title="Track your order"
      description="Enter your order reference and checkout email — no account required. Signed-in customers can also view all orders from their account."
    >
      <ContentSection>
        <TrackOrderForm />
        <ContentProse>
          <p className="mt-6 text-[13px]">
            Gift orders with address collection will show a secure handover link
            for your recipient. Questions?{" "}
            <Link href="/contact" className="text-kay-gold hover:underline">
              Contact us
            </Link>
            .
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
