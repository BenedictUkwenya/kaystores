import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchVendorById } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminVendorActions } from "@/components/admin/AdminVendorActions";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type Props = { params: Promise<{ id: string }> };

export default async function AdminVendorDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const vendor = await fetchVendorById(id);
  if (!vendor) notFound();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Vendor detail"
      title={vendor.businessName}
      badge="Admin"
    >
      <div className="space-y-6 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]">
        <StatusBadge status={vendor.status} />
        <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-kay-subtle">Contact</dt>
            <dd className="text-kay-fg">{vendor.contactName}</dd>
          </div>
          <div>
            <dt className="text-kay-subtle">Email</dt>
            <dd className="text-kay-fg">{vendor.contactEmail}</dd>
          </div>
          <div>
            <dt className="text-kay-subtle">Phone</dt>
            <dd className="text-kay-fg">{vendor.contactPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-kay-subtle">NIN</dt>
            <dd className="font-mono text-kay-fg">{vendor.nin || "—"}</dd>
          </div>
          <div>
            <dt className="text-kay-subtle">Onboarding</dt>
            <dd className="text-kay-fg capitalize">
              {vendor.onboardingSource.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-kay-subtle">After Dark trusted</dt>
            <dd className="text-kay-fg">{vendor.canListAfterDark ? "Yes" : "No"}</dd>
          </div>
        </dl>
        <p className="text-[13px] leading-relaxed text-kay-muted">{vendor.catalogDescription}</p>
        <AdminVendorActions vendor={vendor} />
      </div>
    </DashboardLayout>
  );
}
