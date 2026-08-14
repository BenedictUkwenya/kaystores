import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";
import { IconCheckCircle, IconClock, IconStore } from "@/components/ui/Icons";

export default async function AdminVendorInvitesPage() {
  await requireAdmin();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Onboarding"
      title="Invite vendor"
      description="Invite a curated partner. Instant access or short profile — both auto-approve without the KYC queue."
      badge="Admin"
      actions={
        <Link
          href="/admin/vendors/applications"
          className="inline-flex h-10 items-center rounded-full border border-kay-border px-5 text-[12px] font-medium hover:border-kay-fg"
        >
          View applications
        </Link>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <IconStore className="h-4 w-4" />,
            title: "Choose the partner",
            text: "Use invites for curated boutiques you already trust.",
          },
          {
            icon: <IconClock className="h-4 w-4" />,
            title: "Pick access mode",
            text: "Instant portal, or ask them to complete a short profile first.",
          },
          {
            icon: <IconCheckCircle className="h-4 w-4" />,
            title: "They go live",
            text: "Invited vendors are auto-approved — no NIN queue delay.",
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

      <div className="rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] sm:p-8">
        <AdminInviteForm />
      </div>
    </DashboardLayout>
  );
}
