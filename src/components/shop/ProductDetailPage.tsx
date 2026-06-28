import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products/queries";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductInfo } from "@/components/shop/ProductInfo";
import { ProductSpecs } from "@/components/shop/ProductSpecs";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { ProductComparePanel } from "@/components/compare/ProductComparePanel";

type ProductDetailPageProps = {
  slug: string;
};

export async function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-12 lg:px-16 lg:py-12">
      <nav className="mb-8 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-wider text-kay-subtle">
        <Link href="/" className="transition-colors hover:text-kay-fg">
          Home
        </Link>
        <span>/</span>
        <Link href="/gifts" className="transition-colors hover:text-kay-fg">
          Gifts
        </Link>
        <span>/</span>
        <span className="text-kay-muted">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />
        <ProductInfo product={product} />
      </div>

      <ProductSpecs specs={product.specs} />
      <ProductComparePanel product={product} />
      <RelatedProducts products={related} />
    </div>
  );
}
