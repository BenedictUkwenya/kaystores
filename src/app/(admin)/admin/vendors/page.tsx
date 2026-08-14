import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { IconPlus, IconStore, IconUsers } from "@/components/ui/Icons";
import type { Vendor } from "@/types/dashboard";

export default async function AdminVendorsPage() {
  await requireAdmin();
  const vendors = await fetchAllVendors();
  const approved = vendors.filter((v) => v.status === "approved").length;
  const pending = vendors.filter((v) => v.status === "pending").length;
  const trusted = vendors.filter((v) => v.canListAfterDark).length;

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Partners"
      title="Vendors"
      description={`${vendors.length} partners · ${approved} approved · ${pending} pending · ${trusted} After Dark trusted.`}
      badge="Admin"
      actions={
        <>
          <Link
            href="/admin/vendors/applications"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-kay-border px-4 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
          >
            <IconUsers className="h-3.5 w-3.5" />
            Applications
            {pending > 0 && (
              <span className="rounded-full bg-kay-gold px-1.5 text-[10px] font-semibold text-white">
                {pending}
              </span>
            )}
          </Link>
          <Link
            href="/admin/vendors/invites"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-kay-accent px-4 text-[12px] font-medium text-kay-accent-fg"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Invite vendor
          </Link>
        </>
      }
    >
      {vendors.length === 0 ? (
        <DashboardEmptyState
          icon={<IconStore className="h-6 w-6" />}
          title="No vendors yet"
          description="Invite a curated partner or wait for self-apply applications with NIN verification."
          actionHref="/admin/vendors/invites"
          actionLabel="Send invite"
          secondaryHref="/admin/vendors/applications"
          secondaryLabel="View applications"
        />
      ) : (
        <DataTable<Vendor>
          rows={vendors}
          keyFn={(v) => v.id}
          columns={[
            {
              key: "name",
              header: "Business",
              render: (v) => (
                <div>
                  <Link
                    href={`/admin/vendors/${v.id}`}
                    className="font-medium hover:text-kay-gold"
                  >
                    {v.businessName}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-kay-subtle">
                    {v.contactName}
                  </p>
                </div>
              ),
            },
            {
              key: "email",
              header: "Contact",
              render: (v) => (
                <div>
                  <p>{v.contactEmail}</p>
                  <p className="text-[11px] text-kay-subtle">{v.contactPhone || "—"}</p>
                </div>
              ),
            },
            {
              key: "source",
              header: "Onboarding",
              render: (v) => (
                <span className="capitalize text-kay-muted">
                  {v.onboardingSource.replace(/_/g, " ")}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (v) => <StatusBadge status={v.status} />,
            },
            {
              key: "trusted",
              header: "After Dark",
              render: (v) =>
                v.canListAfterDark ? (
                  <span className="font-medium text-kay-gold">Trusted</span>
                ) : (
                  <span className="text-kay-subtle">—</span>
                ),
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
}
