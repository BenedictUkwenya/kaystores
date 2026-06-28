import { requireVendor } from "@/lib/auth/roles";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { VendorSettingsForm } from "@/components/vendor/VendorSettingsForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export default async function VendorSettingsPage() {
  const { vendor } = await requireVendor();

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Profile"
      title="Settings"
      description="Business details and bank information for payouts."
    >
      <div className="mb-6">
        <StatusBadge status={vendor.status} />
      </div>
      <VendorSettingsForm vendor={vendor} />
    </DashboardLayout>
  );
}
