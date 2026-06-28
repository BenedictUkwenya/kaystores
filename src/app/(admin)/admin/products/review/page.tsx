import { requireAdmin } from "@/lib/auth/roles";
import { fetchPendingProducts } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminProductReviewActions } from "@/components/admin/AdminProductReviewActions";
import { formatNaira } from "@/lib/data/home";

export default async function AdminProductReviewPage() {
  await requireAdmin();
  const products = await fetchPendingProducts();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Moderation"
      title="Product review queue"
      description="Approve listings before they go live on Kay."
      badge="Admin"
    >
      <ul className="space-y-4">
        {products.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap">
              {p.images[0] && (
                <img
                  src={p.images[0]}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[22px] text-kay-fg">{p.name}</p>
                <p className="text-[13px] text-kay-muted">
                  {p.brand} · {formatNaira(p.price)} · {p.segment ?? "gifting"}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-kay-muted line-clamp-3">
                  {p.description}
                </p>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <AdminProductReviewActions product={p} />
              </div>
            </div>
          </li>
        ))}
        {products.length === 0 && (
          <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center text-[14px] text-kay-muted">
            No products awaiting review.
          </li>
        )}
      </ul>
    </DashboardLayout>
  );
}
