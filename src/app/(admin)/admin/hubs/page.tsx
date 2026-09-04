import { requireAdmin } from "@/lib/auth/roles";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminShippingHubsManager } from "@/components/admin/AdminShippingHubsManager";
import { listShippingHubs } from "@/lib/shipping/hubs";

export default async function AdminHubsPage() {
  await requireAdmin();
  const hubs = await listShippingHubs();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Operations"
      title="Shipping hubs"
      description="Kay warehouses Terminal picks up from. Checkout routes by customer state."
      badge="Admin"
    >
      <AdminShippingHubsManager initialHubs={hubs} />
    </DashboardLayout>
  );
}
