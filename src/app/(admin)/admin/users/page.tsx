import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllUsers, fetchPendingRoleInvites } from "@/lib/admin/users";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminUsersList } from "@/components/admin/AdminUsersList";
import { AdminRoleInviteForm } from "@/components/admin/AdminRoleInviteForm";

export default async function AdminUsersPage() {
  const ctx = await requireAdmin();
  const [users, pendingInvites] = await Promise.all([
    fetchAllUsers(),
    fetchPendingRoleInvites(),
  ]);

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="People"
      title="Members"
      description="Filter, search, and manage every Kay account — including open invitations."
      badge="Admin"
    >
      <div className="space-y-8">
        <AdminUsersList
          users={users}
          pendingInvites={pendingInvites}
          currentAdminId={ctx.userId}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <AdminRoleInviteForm />
          <div className="rounded-2xl border border-kay-border-light bg-kay-surface/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
              Guidance
            </p>
            <ul className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-kay-muted">
              <li>Suspend pauses access without deleting the account.</li>
              <li>Block signs the member out immediately.</li>
              <li>Known emails upgrade on the spot — no invite required.</li>
              <li>
                Use the Invited tab to remind people who haven&apos;t registered
                yet, or copy their signup link.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
