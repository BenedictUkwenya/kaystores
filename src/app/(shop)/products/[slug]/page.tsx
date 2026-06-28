import { ProductDetailPage } from "@/components/shop/ProductDetailPage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}
