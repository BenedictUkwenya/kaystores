import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchVendorById } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminVendorActions } from "@/components/admin/AdminVendorActions";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { IconImport, IconPlus } from "@/components/ui/Icons";

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
      eyebrow="Partner profile"
      title={vendor.businessName}
      description={`${vendor.contactName} · ${vendor.onboardingSource.replace(/_/g, " ")} · After Dark ${vendor.canListAfterDark ? "trusted" : "not trusted"}`}
      badge="Admin"
      actions={
        vendor.status === "approved" ? (
          <>
            <Link
              href={`/admin/products/import?vendorId=${vendor.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-kay-border px-4 text-[12px] font-medium hover:border-kay-fg"
            >
              <IconImport className="h-3.5 w-3.5" />
              Import
            </Link>
            <Link
              href={`/admin/products/new?vendorId=${vendor.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-kay-accent px-4 text-[12px] font-medium text-kay-accent-fg"
            >
              <IconPlus className="h-3.5 w-3.5" />
              Add product
            </Link>
          </>
        ) : undefined
      }
    >
      <div className="space-y-6 rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] sm:p-8">
        <StatusBadge status={vendor.status} />
        <dl className="grid grid-cols-1 gap-4 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              Contact
            </dt>
            <dd className="mt-1 text-kay-fg">{vendor.contactName}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              Email
            </dt>
            <dd className="mt-1 text-kay-fg">{vendor.contactEmail}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              Phone
            </dt>
            <dd className="mt-1 text-kay-fg">{vendor.contactPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              NIN
            </dt>
            <dd className="mt-1 font-mono text-kay-fg">{vendor.nin || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              Onboarding
            </dt>
            <dd className="mt-1 capitalize text-kay-fg">
              {vendor.onboardingSource.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              After Dark
            </dt>
            <dd className="mt-1 text-kay-fg">
              {vendor.canListAfterDark ? "Trusted" : "Not trusted"}
            </dd>
          </div>
        </dl>
        <div className="rounded-2xl border border-kay-border-light bg-kay-surface/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
            Catalogue note
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-kay-muted">
            {vendor.catalogDescription || "No description provided."}
          </p>
        </div>
        <AdminVendorActions vendor={vendor} />
      </div>
    </DashboardLayout>
  );
}
