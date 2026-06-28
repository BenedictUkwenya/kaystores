import { requireAdmin } from "@/lib/auth/roles";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";

export default async function AdminVendorInvitesPage() {
  await requireAdmin();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Onboarding"
      title="Invite vendor"
      description="Generate a secure apply link for a curated partner."
      badge="Admin"
    >
      <AdminInviteForm />
    </DashboardLayout>
  );
}
