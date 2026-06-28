import { CatalogPage } from "@/components/shop/CatalogPage";
import { MAIN_CATALOG } from "@/lib/shop/collections";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function GiftsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <CatalogPage
      config={MAIN_CATALOG}
      basePath="/gifts"
      searchParams={params}
    />
  );
}
