import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/shop/CatalogPage";
import { getCollectionBySlug } from "@/lib/shop/collections";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const config = getCollectionBySlug(slug);
  if (!config) notFound();

  const query = await searchParams;
  return (
    <CatalogPage
      config={config}
      basePath={`/gifts/${slug}`}
      searchParams={query}
    />
  );
}
