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
      description="Add a product to your catalogue. Publish when you're ready — it goes live on Kay straight away."
    >
      <VendorProductForm
        vendorId={vendor.id}
        canListAfterDark={vendor.canListAfterDark}
      />
    </DashboardLayout>
  );
}
