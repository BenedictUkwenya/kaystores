import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Kay Stores team.",
};

export default function CareersPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Careers" },
      ]}
      eyebrow="About Kay"
      title="Careers at Kay"
      description="We're building the future of luxury gifting in Nigeria. Roles opening soon."
    >
      <ContentSection>
        <ContentProse>
          <p>
            Kay is growing — from curation and logistics to technology and
            client experience. We&apos;re not hiring publicly yet, but we&apos;d
            love to hear from exceptional people.
          </p>
          <p>
            Send your CV and a short note to{" "}
            <a
              href="mailto:careers@kaystores.com"
              className="text-kay-gold hover:underline"
            >
              careers@kaystores.com
            </a>
            , or{" "}
            <Link href="/contact" className="text-kay-gold hover:underline">
              get in touch
            </Link>
            .
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
