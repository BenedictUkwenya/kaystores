import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminVendorActions } from "@/components/admin/AdminVendorActions";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { IconCheckCircle, IconClock, IconStore } from "@/components/ui/Icons";
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
      eyebrow="Partner queue"
      title="Vendor applications"
      description="Self-applied partners with NIN. Invited vendors skip this queue and are auto-approved."
      badge="Admin"
      actions={
        <Link
          href="/admin/vendors/invites"
          className="inline-flex h-10 items-center rounded-full border border-kay-border px-5 text-[12px] font-medium hover:border-kay-fg"
        >
          Invite instead
        </Link>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <IconClock className="h-4 w-4" />,
            title: "Review NIN",
            text: "Confirm the 11-digit NIN and contact details match.",
          },
          {
            icon: <IconStore className="h-4 w-4" />,
            title: "Catalogue fit",
            text: "Check that their assortment suits Kay’s luxury brief.",
          },
          {
            icon: <IconCheckCircle className="h-4 w-4" />,
            title: "Approve or reject",
            text: "Grant After Dark only for trusted adult-catalogue partners.",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kay-surface text-kay-gold">
              {step.icon}
            </div>
            <p className="mt-3 text-[13px] font-medium text-kay-fg">{step.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-kay-muted">
              {step.text}
            </p>
          </div>
        ))}
      </div>

      {vendors.length === 0 ? (
        <DashboardEmptyState
          icon={<IconCheckCircle className="h-6 w-6" />}
          title="Queue is clear"
          description="No self-apply applications waiting. Invite curated partners anytime."
          actionHref="/admin/vendors/invites"
          actionLabel="Invite a vendor"
          secondaryHref="/admin/vendors"
          secondaryLabel="All vendors"
        />
      ) : (
        <ul className="space-y-4">
          {vendors.map((v: Vendor) => (
            <li
              key={v.id}
              className="rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-[24px] text-kay-fg">
                      {v.businessName}
                    </p>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="mt-2 text-[13px] text-kay-muted">
                    {v.contactName} · {v.contactEmail} · {v.contactPhone}
                  </p>
                  {v.nin && (
                    <p className="mt-2 text-[13px] text-kay-fg">
                      NIN{" "}
                      <span className="font-mono tracking-wide">{v.nin}</span>
                    </p>
                  )}
                  <p className="mt-4 text-[13px] leading-relaxed text-kay-muted">
                    {v.catalogDescription}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-kay-subtle">
                    <span className="rounded-full border border-kay-border-light px-2.5 py-1">
                      Self apply
                    </span>
                    <span className="rounded-full border border-kay-border-light px-2.5 py-1">
                      Applied {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="w-full lg:max-w-sm">
                  <AdminVendorActions vendor={v} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
