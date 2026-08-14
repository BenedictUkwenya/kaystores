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
      eyebrow="Catalogue"
      title={`Edit ${product.name}`}
      description="Update this listing, its images, categories, stock, or publishing status."
      badge="Admin"
    >
      <VendorProductForm
        variant="admin"
        product={product}
        vendorId={product.vendor_id ?? ""}
        canListAfterDark={Boolean(vendor?.canListAfterDark)}
      />
    </DashboardLayout>
  );
}
