import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AfterDarkProductCard } from "@/components/after-dark/AfterDarkProductCard";
import { isAfterDarkAgeVerified } from "@/lib/after-dark/age-gate";
import { AFTER_DARK_ROUTES } from "@/lib/after-dark/catalog";
import { getAfterDarkProducts } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Search — Kay After Dark",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AfterDarkSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const verified = isAfterDarkAgeVerified(await cookies());
  const { products, total } = verified
    ? await getAfterDarkProducts({
        pageSize: 48,
        sort: "newest",
        filters: q ? { search: q } : {},
      })
    : { products: [], total: 0 };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-10">
      <nav className="text-[12px] text-white/50">
        <Link href={AFTER_DARK_ROUTES.home} className="hover:text-ad-amber">
          After Dark
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white/80">Search</span>
      </nav>
      <h1 className="mt-4 font-serif text-[32px] text-white">
        {q ? `Results for “${q}”` : "Search After Dark"}
      </h1>
      <p className="mt-2 text-[14px] text-white/55">
        {verified
          ? total
            ? `${total} ${total === 1 ? "item" : "items"}`
            : "No matches — try another term."
          : "Confirm your age on the previous screen to search the collection."}
      </p>
      {verified && products.length > 0 && (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id}>
              <AfterDarkProductCard product={product} index={index} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
