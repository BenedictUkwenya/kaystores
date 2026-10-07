import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";
import { AdminPendingInviteActions } from "@/components/admin/AdminPendingInviteActions";
import { fetchPendingRoleInvites } from "@/lib/admin/users";
import { IconCheckCircle, IconClock, IconStore } from "@/components/ui/Icons";

export default async function AdminVendorInvitesPage() {
  await requireAdmin();
  const pending = (await fetchPendingRoleInvites()).filter(
    (invite) => invite.role === "vendor",
  );

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

      {pending.length > 0 && (
        <section className="mt-6 rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">
            Waiting to join
          </p>
          <p className="mt-1 text-[13px] text-kay-muted">
            These vendors have not registered yet. Send the invite email again if they missed it.
          </p>
          <ul className="mt-4 divide-y divide-kay-border-light">
            {pending.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-[14px] font-medium text-kay-fg">{invite.email}</p>
                  <p className="text-[12px] text-kay-muted">
                    {invite.businessName || "Vendor"} ·{" "}
                    {invite.inviteMode === "instant" ? "Instant access" : "Profile first"}
                  </p>
                </div>
                <AdminPendingInviteActions invite={invite} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </DashboardLayout>
  );
}
