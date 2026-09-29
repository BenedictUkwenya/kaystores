import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AfterDarkProductDetail } from "@/components/after-dark/AfterDarkProductDetail";
import { isAfterDarkAgeVerified } from "@/lib/after-dark/age-gate";
import { getProductBySlug } from "@/lib/products/queries";
import { isAfterDarkProduct } from "@/lib/pricing/segment";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isAfterDarkAgeVerified(await cookies())) {
    return { title: "Kay After Dark", robots: { index: false, follow: false } };
  }
  const product = await getProductBySlug(slug);
  if (!product || !isAfterDarkProduct(product)) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }
  return {
    title: `${product.name} — Kay After Dark`,
    robots: { index: false, follow: false },
  };
}

export default async function AfterDarkProductPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isAfterDarkAgeVerified(await cookies())) {
    redirect("/after-dark");
  }
  const product = await getProductBySlug(slug);
  if (!product || !isAfterDarkProduct(product)) notFound();
  return <AfterDarkProductDetail slug={slug} />;
}
