import { CatalogPage } from "@/components/shop/CatalogPage";
import { KayFeaturedStrip } from "@/components/kay/KayFeaturedStrip";
import { MAIN_CATALOG } from "@/lib/shop/collections";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function GiftsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <>
      <KayFeaturedStrip />
      <CatalogPage
        config={MAIN_CATALOG}
        basePath="/gifts"
        searchParams={params}
      />
    </>
  );
}
