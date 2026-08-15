import { CatalogPage } from "@/components/shop/CatalogPage";
import { getSearchConfig } from "@/lib/shop/collections";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const config = getSearchConfig(q, {
    collection: params.collection,
  });

  return (
    <CatalogPage
      config={config}
      basePath="/search"
      searchParams={params}
    />
  );
}
