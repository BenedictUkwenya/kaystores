import Link from "next/link";
import { TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";
import { getTableProducts } from "@/lib/products/queries";
import { TABLE_CATEGORIES } from "@/lib/table/catalog";
import { TableCatalogSection } from "@/components/table/TableCatalogSection";
import { TableHero } from "@/components/table/TableHero";

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
      <TableCatalogSection products={products} activeTag={activeTag} />
      <section className="border-t border-[var(--table-line)] px-4 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-lg">
          <h2 className="font-serif text-[28px] tracking-[-0.02em] text-[var(--table-ink)] sm:text-[32px]">
            Need something made to order?
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--table-muted)]">
            Share your occasion and flavours — Kay pairs you with a trusted baker.
          </p>
          <Link
            href={TABLE_ROUTES.request}
            className="table-cta mt-8 inline-flex h-12 items-center justify-center rounded-full px-8 text-[13px] font-semibold"
          >
            {TABLE_COPY.heroRequest}
          </Link>
        </div>
      </section>
    </>
  );
}
