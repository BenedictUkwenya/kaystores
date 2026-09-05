import { requireAdmin } from "@/lib/auth/roles";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminShippingHubsManager } from "@/components/admin/AdminShippingHubsManager";
import { AdminShippingSettingsForm } from "@/components/admin/AdminShippingSettingsForm";
import { listShippingHubs } from "@/lib/shipping/hubs";
import { getShippingSettings } from "@/lib/shipping/settings";

export default async function AdminHubsPage() {
  await requireAdmin();
  const [hubs, settings] = await Promise.all([
    listShippingHubs(),
    getShippingSettings(),
  ]);

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Operations"
      title="Shipping"
      description="Turn Terminal or Kay delivery on/off, then manage hubs for live rates."
      badge="Admin"
    >
      <div className="space-y-10">
        <AdminShippingSettingsForm initial={settings} />
        <div>
          <h2 className="font-serif text-[22px] text-kay-fg">Hubs</h2>
          <p className="mt-1 text-[13px] text-kay-muted">
            Used when Terminal live rates are enabled. Checkout routes by
            customer state.
          </p>
          <div className="mt-6">
            <AdminShippingHubsManager initialHubs={hubs} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
