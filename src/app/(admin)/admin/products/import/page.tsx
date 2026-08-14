import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminProductImportWizard } from "@/components/admin/AdminProductImportWizard";

type Props = {
  searchParams: Promise<{ vendorId?: string }>;
};

export default async function AdminProductImportPage({ searchParams }: Props) {
  await requireAdmin();
  const { vendorId } = await searchParams;
  const vendors = await fetchAllVendors("approved");

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Catalogue"
      title="Import products"
      description="Pick a vendor once, set shared defaults, then upload a CSV and images named by SKU."
      badge="Admin"
    >
      <AdminProductImportWizard
        vendors={vendors}
        initialVendorId={vendorId}
      />
    </DashboardLayout>
  );
}
