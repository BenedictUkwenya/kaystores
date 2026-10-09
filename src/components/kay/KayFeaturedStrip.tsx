import Image from "next/image";
import Link from "next/link";
import { listActiveFeaturedProducts } from "@/lib/ai/featured";
import { formatNaira } from "@/lib/data/home";
import { KayMark } from "@/components/kay/KayMark";

export async function KayFeaturedStrip() {
  const products = await listActiveFeaturedProducts();
  if (products.length === 0) return null;

  return (
    <section className="bg-kay-bg px-4 pt-8 lg:px-10">
      <div className="mx-auto flex max-w-[1280px] gap-3 rounded-2xl border border-kay-border bg-kay-surface px-4 py-4">
        <KayMark className="mt-0.5 h-8 w-8 shrink-0 text-kay-gold" />
        <div className="min-w-0">
          <p className="text-[14px] text-kay-fg">
            Kay thinks these are worth a look.
          </p>
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {products.map((product) => (
              <li key={product.id} className="w-40 shrink-0">
                <Link href={`/products/${product.slug}`} className="block">
                  <span className="relative block h-24 overflow-hidden rounded-lg bg-kay-surface-elevated">
                    <Image
                      src={product.images[0] ?? "/images/kay-hero-luxury-box.png"}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </span>
                  <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-kay-gold">
                    Featured
                  </span>
                  <span className="block truncate text-[13px] text-kay-fg">{product.name}</span>
                  <span className="text-[12px] text-kay-muted">{formatNaira(product.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
