import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CatalogPage } from "@/components/shop/CatalogPage";
import { getSearchConfig } from "@/lib/shop/collections";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (params.collection === "after-dark") {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    const qs = sp.toString();
    redirect(qs ? `/after-dark/search?${qs}` : "/after-dark/search");
  }
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
