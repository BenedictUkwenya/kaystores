import type { Metadata } from "next";
import {
  ContentPageLayout,
  ContentProse,
  ContentSection,
} from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: "Sustainability",
  description: "Kay Stores commitment to responsible sourcing and packaging.",
};

export default function SustainabilityPage() {
  return (
    <ContentPageLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Sustainability" },
      ]}
      eyebrow="About Kay"
      title="Sustainability"
      description="Luxury and responsibility can coexist. Here's how we're thinking about it."
    >
      <ContentSection>
        <ContentProse>
          <p>
            Kay partners with a curated vendor network — reducing waste from
            mass-market overstock and prioritising quality pieces built to last.
          </p>
          <p>
            Our rigid gift packaging is designed for reuse and keepsake storage.
            We&apos;re working toward more recycled materials in outer shipping
            cartons while preserving the discretion our clients expect.
          </p>
          <p>
            We vet vendors on product standards and ethical sourcing as our
            network grows. Sustainability is a journey — we&apos;ll share more
            as our programs mature.
          </p>
        </ContentProse>
      </ContentSection>
    </ContentPageLayout>
  );
}
