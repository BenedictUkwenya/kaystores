import { notFound } from "next/navigation";
import { requireVendor } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { mapProductRow } from "@/types/product";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { VendorProductForm } from "@/components/vendor/VendorProductForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditVendorProductPage({ params }: Props) {
  const { vendor } = await requireVendor();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (!data) notFound();
  const product = mapProductRow(data);

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Edit listing"
      title={product.name}
      description={`Status: ${product.status ?? "draft"}`}
    >
      <VendorProductForm
        product={product}
        vendorId={vendor.id}
        canListAfterDark={vendor.canListAfterDark}
      />
    </DashboardLayout>
  );
}
