import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchVendorById } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { VendorProductForm } from "@/components/vendor/VendorProductForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProductRow } from "@/types/product";

type Props = { params: Promise<{ id: string }> };

export default async function EditAdminProductPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin!
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const product = mapProductRow(data);
  const vendor = product.vendor_id
    ? await fetchVendorById(product.vendor_id)
    : null;

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow={product.vendor_id ? "Vendor listing" : "Kay inventory"}
      title={`Edit ${product.name}`}
      description={
        product.vendor_id
          ? `Vendor product${vendor ? ` for ${vendor.businessName}` : ""}. You can update details, images, stock, or delete this listing.`
          : "Kay-owned inventory — vendor payouts do not apply."
      }
      badge="Admin"
      actions={
        <Link
          href="/admin/products"
          className="inline-flex h-10 items-center rounded-full border border-kay-border px-4 text-[12px] font-medium hover:border-kay-fg"
        >
          Back to products
        </Link>
      }
    >
      <VendorProductForm
        variant="admin"
        product={product}
        vendorId={product.vendor_id}
        canListAfterDark={
          product.vendor_id ? Boolean(vendor?.canListAfterDark) : true
        }
      />
    </DashboardLayout>
  );
}
