import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors, fetchVendorById } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { VendorProductForm } from "@/components/vendor/VendorProductForm";

type Props = {
  searchParams: Promise<{ vendorId?: string }>;
};

export default async function AdminNewProductPage({ searchParams }: Props) {
  await requireAdmin();
  const { vendorId } = await searchParams;

  if (!vendorId) {
    const vendors = await fetchAllVendors("approved");
    return (
      <DashboardLayout
        role="admin"
        nav={ADMIN_NAV}
        eyebrow="Catalogue"
        title="Add one product"
        description="Choose the vendor this listing belongs to."
        badge="Admin"
      >
        {vendors.length === 0 ? (
          <p className="text-[14px] text-kay-muted">No approved vendors yet.</p>
        ) : (
          <ul className="divide-y divide-kay-border-light border-y border-kay-border-light">
            {vendors.map((vendor) => (
              <li key={vendor.id}>
                <Link
                  href={`/admin/products/new?vendorId=${vendor.id}`}
                  className="flex items-baseline justify-between gap-4 py-3 text-[14px] hover:text-kay-gold"
                >
                  <span className="font-medium">{vendor.businessName}</span>
                  <span className="text-[12px] text-kay-subtle">
                    {vendor.contactEmail}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashboardLayout>
    );
  }

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
