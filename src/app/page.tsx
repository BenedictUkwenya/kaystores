import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { AIConciergeSection } from "@/components/home/AIConciergeSection";
import { ShopBySection } from "@/components/home/ShopBySection";
import { CuratedSection } from "@/components/home/CuratedSection";
import { PressSection } from "@/components/home/PressSection";
import { ValuePropsBar } from "@/components/home/ValuePropsBar";
import { getCuratedProducts } from "@/lib/products/queries";
import { baseMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  ...baseMetadata,
  title: siteConfig.title,
  openGraph: {
    ...baseMetadata.openGraph,
    title: siteConfig.title,
    description: siteConfig.tagline,
  },
  twitter: {
    ...baseMetadata.twitter,
    title: siteConfig.title,
    description: siteConfig.tagline,
  },
};

export default async function Home() {
  const curatedProducts = await getCuratedProducts(5);

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AIConciergeSection />
        <ShopBySection />
        <CuratedSection products={curatedProducts} />
        <PressSection />
        <ValuePropsBar />
      </main>
      <Footer />
    </>
  );
}
