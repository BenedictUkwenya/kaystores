import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { AIConciergeSection } from "@/components/home/AIConciergeSection";
import { ShopBySection } from "@/components/home/ShopBySection";
import { CuratedSection } from "@/components/home/CuratedSection";
import { PressSection } from "@/components/home/PressSection";
import { ValuePropsBar } from "@/components/home/ValuePropsBar";
import { LaunchCountdownHero } from "@/components/launch/LaunchCountdownHero";
import { MessiTributeHero } from "@/components/tribute/MessiTributeHero";
import { MessiQuoteMarquee } from "@/components/tribute/MessiQuoteMarquee";
import { MessiPicksSection } from "@/components/tribute/MessiPicksSection";
import { getCuratedProducts, getMessiPicks } from "@/lib/products/queries";
import { baseMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { isTributeActive, TRIBUTE_COPY } from "@/lib/tribute";

/** Fresh product mix on every visit — do not cache a fixed “new arrivals” list. */
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const title = isTributeActive()
    ? `${TRIBUTE_COPY.headline} — ${siteConfig.name}`
    : siteConfig.title;
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
  const tribute = isTributeActive();
  const [curatedProducts, messiPicks] = await Promise.all([
    getCuratedProducts(5),
    tribute ? getMessiPicks(8) : Promise.resolve([]),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {tribute ? <MessiTributeHero /> : <HeroSection />}
        {tribute && <MessiQuoteMarquee />}
        <LaunchCountdownHero />
        {tribute && <MessiPicksSection products={messiPicks} />}
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
