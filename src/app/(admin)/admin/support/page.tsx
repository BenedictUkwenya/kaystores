import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminSupportInbox } from "@/components/admin/AdminSupportInbox";

export default async function AdminSupportPage() {
  await requireAdmin();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Support"
      title="Customer messages"
      description="Reply to customers and vendors. Open threads needing a response are marked in the inbox."
      badge="Admin"
    >
      <Suspense
        fallback={
          <p className="py-12 text-center text-[14px] text-kay-muted">
            Loading inbox…
          </p>
        }
      >
        <AdminSupportInbox />
      </Suspense>
    </DashboardLayout>
  );
}
