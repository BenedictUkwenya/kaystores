import { AfterDarkFeaturedSection } from "@/components/after-dark/AfterDarkFeaturedSection";
import { AfterDarkDivider } from "@/components/after-dark/AfterDarkDivider";
import { AfterDarkHero } from "@/components/after-dark/AfterDarkHero";
import { MidnightCuratedBox } from "@/components/after-dark/MidnightCuratedBox";
import { getAfterDarkProducts } from "@/lib/products/queries";

export default async function AfterDarkPage() {
  const { products } = await getAfterDarkProducts({ pageSize: 24 });

  return (
    <>
      <AfterDarkHero />
      <AfterDarkDivider />
      <AfterDarkFeaturedSection products={products} />
      <MidnightCuratedBox />
    </>
  );
}
