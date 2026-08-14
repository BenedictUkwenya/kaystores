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
        title="Add one product"
        description="Choose whether this listing is Kay inventory or belongs to a vendor."
        badge="Admin"
      >
        <div className="space-y-5">
          <Link
            href="/admin/products/new?owner=kay"
            className="flex items-baseline justify-between rounded-xl border border-kay-gold/40 bg-kay-gold-light/20 px-4 py-4 text-[14px] hover:border-kay-gold"
          >
            <span className="font-medium">Kay Stores inventory</span>
            <span className="text-[12px] text-kay-muted">
              Kay-owned · no vendor payout
            </span>
          </Link>
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
        </div>
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
