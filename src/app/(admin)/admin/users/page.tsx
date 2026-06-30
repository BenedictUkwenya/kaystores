import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllUsers } from "@/lib/admin/users";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminUsersList } from "@/components/admin/AdminUsersList";
import { AdminRoleInviteForm } from "@/components/admin/AdminRoleInviteForm";

export default async function AdminUsersPage() {
  const ctx = await requireAdmin();
  const users = await fetchAllUsers();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="People"
      title="Members"
      description="Every account on Kay — roles, access, and invitations in one place."
      badge="Admin"
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
        <AdminUsersList users={users} currentAdminId={ctx.userId} />

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <AdminRoleInviteForm />

          <div className="rounded-2xl border border-kay-border-light bg-kay-surface/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
              Guidance
            </p>
            <ul className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-kay-muted">
              <li>Suspend pauses access without deleting the account.</li>
              <li>Block signs the member out immediately.</li>
              <li>Known emails upgrade on the spot — no invite required.</li>
            </ul>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
