import Link from "next/link";
import { SHOP_CATEGORY_LINKS } from "@/lib/shop/collections";
import { CategoryIcon } from "@/components/ui/Icons";

const CATEGORY_ICONS = {
  "for-her": "handbag",
  "for-him": "watch",
  "for-parents": "parents",
  "for-friends": "gift",
  "for-kids": "teddy",
  "corporate-gifts": "briefcase",
} as const;

export function ShopBySection() {
  return (
    <section className="bg-kay-bg px-6 py-12 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="font-serif text-[28px] text-kay-fg">Shop by</h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {SHOP_CATEGORY_LINKS.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className="group flex flex-col items-center rounded-xl border border-kay-border bg-kay-surface-elevated px-4 py-8 transition-all hover:border-kay-fg hover:shadow-sm"
              style={{ boxShadow: "var(--kay-card-shadow)" }}
            >
              <CategoryIcon
                name={
                  CATEGORY_ICONS[
                    category.slug as keyof typeof CATEGORY_ICONS
                  ]
                }
                className="text-kay-fg opacity-80 transition-opacity group-hover:opacity-100"
              />
              <span className="mt-4 flex items-center gap-1 text-[13px] font-medium text-kay-fg">
                {category.label}
                <span className="text-kay-subtle">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
