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
      description="Invite a curated partner. Choose instant portal access or a short profile (both auto-approved — no KYC queue)."
      badge="Admin"
    >
      <AdminInviteForm />
    </DashboardLayout>
  );
}
