import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors, fetchVendorById } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminProductOwnerPicker } from "@/components/admin/AdminProductOwnerPicker";
import { VendorProductForm } from "@/components/vendor/VendorProductForm";

type Props = {
  searchParams: Promise<{ vendorId?: string; owner?: string }>;
};

export default async function AdminNewProductPage({ searchParams }: Props) {
  await requireAdmin();
  const { vendorId, owner } = await searchParams;

  if (!vendorId && owner !== "kay") {
    const vendors = await fetchAllVendors("approved");
    return (
      <DashboardLayout
        role="admin"
        nav={ADMIN_NAV}
        eyebrow="Catalogue"
        title="Create a new listing"
        description="Start by choosing who owns the inventory. This controls fulfilment, earnings, and payout handling."
        badge="Admin"
      >
        <AdminProductOwnerPicker vendors={vendors} />
      </DashboardLayout>
    );
  }

  if (owner === "kay") {
    return (
      <DashboardLayout
        role="admin"
        nav={ADMIN_NAV}
        eyebrow="Kay inventory"
        title="Add Kay product"
        description="This is Kay-owned inventory. It will not create a vendor payout."
        badge="Admin"
      >
        <VendorProductForm
          variant="admin"
          canListAfterDark
          initialBrand="Kay Stores"
        />
      </DashboardLayout>
    );
  }

  if (!vendorId) notFound();
  const vendor = await fetchVendorById(vendorId);
  if (!vendor || vendor.status !== "approved") notFound();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Catalogue"
      title="Add one product"
      description={`Listing for ${vendor.businessName}. For many SKUs, use Import instead.`}
      badge="Admin"
    >
      <VendorProductForm
        variant="admin"
        vendorId={vendor.id}
        canListAfterDark={vendor.canListAfterDark}
        initialBrand={vendor.businessName}
      />
    </DashboardLayout>
  );
}
