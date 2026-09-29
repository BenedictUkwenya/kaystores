import { cookies } from "next/headers";
import { AfterDarkFeaturedSection } from "@/components/after-dark/AfterDarkFeaturedSection";
import { AfterDarkDivider } from "@/components/after-dark/AfterDarkDivider";
import { AfterDarkHero } from "@/components/after-dark/AfterDarkHero";
import { MidnightCuratedBox } from "@/components/after-dark/MidnightCuratedBox";
import { isAfterDarkAgeVerified } from "@/lib/after-dark/age-gate";
import { getAfterDarkProducts } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function AfterDarkPage() {
  const verified = isAfterDarkAgeVerified(await cookies());
  const { products } = verified
    ? await getAfterDarkProducts({
        pageSize: 24,
        sort: "random",
      })
    : { products: [] };

  return (
    <>
      <AfterDarkHero />
      <AfterDarkDivider />
      <AfterDarkFeaturedSection products={products} />
      <MidnightCuratedBox />
    </>
  );
}
