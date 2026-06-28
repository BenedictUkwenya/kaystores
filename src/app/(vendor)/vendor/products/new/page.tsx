import { requireVendor } from "@/lib/auth/roles";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { VendorProductForm } from "@/components/vendor/VendorProductForm";

export default async function NewVendorProductPage() {
  const { vendor } = await requireVendor();

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="New listing"
      title="Add product"
      description="Draft your listing and submit for Kay's quality review."
    >
      <VendorProductForm canListAfterDark={vendor.canListAfterDark} />
    </DashboardLayout>
  );
}
