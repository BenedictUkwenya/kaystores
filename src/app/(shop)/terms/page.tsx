import type { Metadata } from "next";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of use for Kay Stores.",
};

export default function TermsPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Terms & Conditions" },
      ]}
      title="Terms & conditions"
      description="Last updated June 2026."
    >
      <ContentSection>
        <ContentProse>
          <p>
            By using Kay Stores you agree to these terms. Kay provides curated
            gifting and discreet wellness products with luxury packaging and
            delivery services.
          </p>
          <p>
            <strong className="text-kay-fg">Orders:</strong> minimum order
            values apply (₦50,000 for gifting, ₦20,000 for After Dark). Prices
            include our curation and service fees as shown at checkout. Orders
            are confirmed upon successful payment.
          </p>
          <p>
            <strong className="text-kay-fg">Delivery:</strong> we target
            delivery within 72 hours of payment confirmation, subject to vendor
            and logistics availability. Delays will be communicated promptly.
          </p>
          <p>
            <strong className="text-kay-fg">Returns:</strong> see our{" "}
            <a href="/delivery-returns" className="text-kay-gold hover:underline">
              Delivery &amp; Returns
            </a>{" "}
            policy. Certain intimate or personalised items are non-returnable
            unless faulty on arrival.
          </p>
          <p>
            Questions:{" "}
            <a
              href="mailto:hello@kaystores.com"
              className="text-kay-gold hover:underline"
            >
              hello@kaystores.com
            </a>
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
