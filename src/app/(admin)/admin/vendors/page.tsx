import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { Vendor } from "@/types/dashboard";

export default async function AdminVendorsPage() {
  await requireAdmin();
  const vendors = await fetchAllVendors();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Partners"
      title="Vendors"
      description="Manage vendor applications, trusted status, and suspensions."
      badge="Admin"
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/vendors/applications"
          className="rounded-full border border-kay-border px-4 py-2 text-[12px] font-medium hover:border-kay-fg"
        >
          Applications
        </Link>
        <Link
          href="/admin/vendors/invites"
          className="rounded-full border border-kay-border px-4 py-2 text-[12px] font-medium hover:border-kay-fg"
        >
          Send invite
        </Link>
      </div>

      <DataTable<Vendor>
        rows={vendors}
        keyFn={(v) => v.id}
        columns={[
          {
            key: "name",
            header: "Business",
            render: (v) => (
              <Link href={`/admin/vendors/${v.id}`} className="hover:text-kay-gold">
                {v.businessName}
              </Link>
            ),
          },
          { key: "email", header: "Email", render: (v) => v.contactEmail },
          { key: "status", header: "Status", render: (v) => <StatusBadge status={v.status} /> },
          {
            key: "trusted",
            header: "After Dark",
            render: (v) => (v.canListAfterDark ? "Trusted" : "—"),
          },
        ]}
      />
    </DashboardLayout>
  );
}
