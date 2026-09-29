import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products/queries";
import { isAfterDarkProduct } from "@/lib/pricing/segment";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductInfo } from "@/components/shop/ProductInfo";
import { ProductSpecs } from "@/components/shop/ProductSpecs";
import { AfterDarkProductCard } from "@/components/after-dark/AfterDarkProductCard";
import { AFTER_DARK_ROUTES } from "@/lib/after-dark/catalog";

type Props = { slug: string };

export async function AfterDarkProductDetail({ slug }: Props) {
  const product = await getProductBySlug(slug);
  if (!product || !isAfterDarkProduct(product)) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
      <nav className="mb-8 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/45">
        <Link href={AFTER_DARK_ROUTES.home} className="transition-colors hover:text-ad-amber">
          After Dark
        </Link>
        <span>/</span>
        <Link href={`${AFTER_DARK_ROUTES.home}#selections`} className="transition-colors hover:text-ad-amber">
          Shop
        </Link>
        <span>/</span>
        <span className="text-white/70">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />
        <ProductInfo product={product} />
      </div>

      <ProductSpecs specs={product.specs} />

      {related.length > 0 && (
        <section className="mt-16 border-t border-white/10 pt-12">
          <h2 className="font-serif text-[24px] text-white">You may also like</h2>
          <p className="mt-1 text-[13px] text-white/50">
            More from the After Dark edit
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
            {related.map((item, index) => (
              <li key={item.id}>
                <AfterDarkProductCard product={item} index={index} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
