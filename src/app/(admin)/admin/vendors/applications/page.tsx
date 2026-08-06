import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminVendorActions } from "@/components/admin/AdminVendorActions";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { Vendor } from "@/types/dashboard";

export default async function AdminVendorApplicationsPage() {
  await requireAdmin();
  const vendors = await fetchAllVendors("pending", {
    onboardingSource: "self_apply",
  });

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Queue"
      title="Vendor applications"
      description="Review self-applied partners (NIN + KYC). Invited vendors are auto-approved and do not appear here."
      badge="Admin"
    >
      <ul className="space-y-4">
        {vendors.map((v: Vendor) => (
          <li
            key={v.id}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[22px] text-kay-fg">{v.businessName}</p>
                <p className="mt-1 text-[13px] text-kay-muted">
                  {v.contactName} · {v.contactEmail} · {v.contactPhone}
                </p>
                {v.nin && (
                  <p className="mt-1 text-[13px] text-kay-fg">
                    NIN: <span className="font-mono tracking-wide">{v.nin}</span>
                  </p>
                )}
                <p className="mt-3 text-[13px] leading-relaxed text-kay-muted">
                  {v.catalogDescription}
                </p>
                <div className="mt-3">
                  <StatusBadge status={v.status} />
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <AdminVendorActions vendor={v} />
              </div>
            </div>
          </li>
        ))}
        {vendors.length === 0 && (
          <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center text-[14px] text-kay-muted">
            No pending applications.
          </li>
        )}
      </ul>
    </DashboardLayout>
  );
}
