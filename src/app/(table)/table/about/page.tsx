import Link from "next/link";
import { TABLE_ROUTES } from "@/lib/table/catalog";

export const metadata = {
  title: "About — Kay Table",
};

export default function TableAboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-10 lg:py-20">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--table-berry)]">
        About Kay Table
      </p>
      <h1 className="mt-3 font-serif text-[28px] text-[var(--table-cocoa)] sm:text-[36px]">
        Celebration food, curated with care
      </h1>
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-[var(--table-muted)]">
        <p>
          Kay Table is our edible world — cakes, chocolates, gourmet hampers, and
          treats chosen for gifting and gatherings. Separate from luxury goods and
          After Dark, with its own bakers and brief.
        </p>
        <p>
          Browse ready-to-buy selections, or request a custom cake. We review every
          brief, assign a trusted baker when needed, and keep you updated in one
          thread.
        </p>
        <p>
          Allergen and storage details appear on product pages when provided by the
          maker. For custom work, mention dietary needs in your request.
        </p>
      </div>
      <Link
        href={TABLE_ROUTES.shop}
        className="table-cta mt-10 inline-flex h-11 items-center justify-center rounded-lg px-8 text-[13px] font-semibold"
      >
        Browse the table
      </Link>
    </div>
  );
}
