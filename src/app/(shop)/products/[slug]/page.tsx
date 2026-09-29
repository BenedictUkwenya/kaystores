import type { Metadata } from "next";
import { ProductDetailPage } from "@/components/shop/ProductDetailPage";
import { getProductBySlug } from "@/lib/products/queries";
import { isAfterDarkProduct } from "@/lib/pricing/segment";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  if (isAfterDarkProduct(product)) {
    return { title: "Kay After Dark", robots: { index: false, follow: false } };
  }

  const plain = product.description.replace(/\s+/g, " ").trim();
  const description =
    plain.length > 160 ? `${plain.slice(0, 157).trimEnd()}…` : plain || undefined;
  const image = product.images[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/products/${product.slug}`,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      title: product.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}
