import { TableCatalogSection } from "@/components/table/TableCatalogSection";
import { TableCategoriesStrip } from "@/components/table/TableCategoriesStrip";
import { TableHero } from "@/components/table/TableHero";
import { getTableProducts } from "@/lib/products/queries";
import { TABLE_CATEGORIES } from "@/lib/table/catalog";
import Link from "next/link";
import { TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ tag?: string }>;
};

export default async function TablePage({ searchParams }: PageProps) {
  const { tag } = await searchParams;
  const activeTag =
    TABLE_CATEGORIES.some((c) => c.tag === tag) ? tag : null;

  const { products } = await getTableProducts({
    pageSize: 24,
    sort: "random",
    filters: activeTag ? { tags: [activeTag] } : undefined,
  });

  return (
    <>
      <TableHero />
      <TableCategoriesStrip />
      <TableCatalogSection products={products} activeTag={activeTag} />
      <section className="border-t border-[var(--table-line)] px-4 py-16 lg:px-10">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-[28px] text-[var(--table-cocoa)] sm:text-[32px]">
            Need something made to order?
          </h2>
          <p className="mt-3 text-[14px] text-[var(--table-muted)]">
            Share your occasion and flavours — Kay pairs you with a trusted baker.
          </p>
          <Link
            href={TABLE_ROUTES.request}
            className="table-cta mt-8 inline-flex h-12 items-center justify-center rounded-lg px-10 text-[14px] font-semibold"
          >
            {TABLE_COPY.heroRequest}
          </Link>
        </div>
      </section>
    </>
  );
}
