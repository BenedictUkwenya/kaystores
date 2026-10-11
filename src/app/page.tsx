import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { KitchenEntry } from "@/components/home/KitchenEntry";
import { AIConciergeSection } from "@/components/home/AIConciergeSection";
import { ShopBySection } from "@/components/home/ShopBySection";
import { CuratedSection } from "@/components/home/CuratedSection";
import { PressSection } from "@/components/home/PressSection";
import { ValuePropsBar } from "@/components/home/ValuePropsBar";
import { LaunchCountdownHero } from "@/components/launch/LaunchCountdownHero";
import { getCuratedProducts } from "@/lib/products/queries";
import { baseMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

/** Fresh product mix on every visit — do not cache a fixed “new arrivals” list. */
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const title = siteConfig.title;
  return {
    ...baseMetadata,
    title,
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description: siteConfig.tagline,
      images: baseMetadata.openGraph?.images,
    },
    twitter: {
      ...baseMetadata.twitter,
      title,
      description: siteConfig.tagline,
      images: baseMetadata.twitter?.images,
    },
  };
}

export default async function Home() {
  const curatedProducts = await getCuratedProducts(5);

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <section className="bg-kay-bg px-4 pb-2 lg:px-10">
          <div className="mx-auto max-w-[1280px]">
            <KitchenEntry />
          </div>
        </section>
        <LaunchCountdownHero />
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
