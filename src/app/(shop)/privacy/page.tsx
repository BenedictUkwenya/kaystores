import type { Metadata } from "next";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Kay Stores collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Privacy Policy" },
      ]}
      title="Privacy policy"
      description="Last updated June 2026."
    >
      <ContentSection>
        <ContentProse>
          <p>
            Kay Stores (&quot;Kay&quot;, &quot;we&quot;) respects your privacy —
            especially for After Dark and anonymous gift orders. This policy
            explains what we collect and how we use it.
          </p>
          <p>
            <strong className="text-kay-fg">What we collect:</strong> account
            details, order and delivery information, payment references (processed
            by our payment partners — we do not store full card numbers), and
            communications with our team.
          </p>
          <p>
            <strong className="text-kay-fg">Discretion:</strong> After Dark
            orders use neutral packaging and confidential handling. Anonymous gift
            options remove your name from recipient-facing materials. We do not
            sell your personal data.
          </p>
          <p>
            <strong className="text-kay-fg">Your rights:</strong> you may
            request access, correction, or deletion of your data by contacting{" "}
            <a
              href="mailto:privacy@kaystores.com"
              className="text-kay-gold hover:underline"
            >
              privacy@kaystores.com
            </a>
            .
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
