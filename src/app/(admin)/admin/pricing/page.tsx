import { requireAdmin } from "@/lib/auth/roles";
import { fetchMarkupTiersAdmin } from "@/lib/admin/pricing";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminPricingTiersManager } from "@/components/admin/AdminPricingTiersManager";

export default async function AdminPricingPage() {
  await requireAdmin();
  const tiers = await fetchMarkupTiersAdmin();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Commerce"
      title="Pricing"
      description="Set Kay’s client markup by vendor list-price range — percent and/or flat ₦. Applies to shop and concierge."
      badge="Admin"
    >
      <AdminPricingTiersManager initialTiers={tiers} />
    </DashboardLayout>
  );
}
