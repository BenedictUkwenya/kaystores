import Link from "next/link";
import { TABLE_CATEGORIES, TABLE_COPY } from "@/lib/table/catalog";

export function TableCategoriesStrip() {
  return (
    <section className="border-y border-[var(--table-line)] bg-[var(--table-paper)]/70 px-4 py-14 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="font-serif text-[28px] text-[var(--table-cocoa)] sm:text-[32px]">
          {TABLE_COPY.categoriesTitle}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TABLE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/table?tag=${cat.tag}`}
              className="group rounded-2xl border border-[var(--table-line)] bg-[var(--table-bg)] px-5 py-6 transition-colors hover:border-[var(--table-cocoa)]/40"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--table-berry)]">
                Kay Table
              </p>
              <p className="mt-2 font-serif text-[22px] text-[var(--table-ink)] group-hover:text-[var(--table-cocoa)]">
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
