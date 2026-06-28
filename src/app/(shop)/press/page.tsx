import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: "Press",
  description: "Kay Stores press and media enquiries.",
};

export default function PressPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Press" },
      ]}
      eyebrow="About Kay"
      title="Press & media"
      description="For interviews, features, and brand assets."
    >
      <ContentSection>
        <ContentProse>
          <p>
            Kay Stores is redefining luxury gifting and discreet e-commerce in
            Nigeria. For press enquiries, partnership features, or the Kay
            unboxing experience for creators, reach our team.
          </p>
          <p>
            Email{" "}
            <a
              href="mailto:press@kaystores.com"
              className="text-kay-gold hover:underline"
            >
              press@kaystores.com
            </a>{" "}
            or use our{" "}
            <Link href="/contact" className="text-kay-gold hover:underline">
              contact form
            </Link>
            .
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
