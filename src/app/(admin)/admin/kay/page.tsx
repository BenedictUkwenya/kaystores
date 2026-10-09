import { requireAdmin } from "@/lib/auth/roles";
import { listFeaturedSlots } from "@/lib/ai/featured";
import { getProducts } from "@/lib/products/queries";
import { ADMIN_NAV, DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminKayFeatured } from "@/components/admin/AdminKayFeatured";

export default async function AdminKayPage() {
  await requireAdmin();
  const [{ products }, slots] = await Promise.all([
    getProducts({ pageSize: 200, sort: "name-asc" }),
    listFeaturedSlots(),
  ]);

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Catalogue"
      title="Kay featured"
      description="A vendor pays to be shown by Kay. Enter the product, the amount, and the dates. Kay only mentions it while those dates are active."
      badge="Admin"
    >
      <AdminKayFeatured
        slots={slots}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
        }))}
      />
    </DashboardLayout>
  );
}
