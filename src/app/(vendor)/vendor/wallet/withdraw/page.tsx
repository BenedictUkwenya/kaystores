import { requireVendor } from "@/lib/auth/roles";
import { getVendorWalletSummary } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { WithdrawForm } from "@/components/vendor/WithdrawForm";

export default async function VendorWithdrawPage() {
  const { vendor } = await requireVendor();
  const wallet = await getVendorWalletSummary(vendor.id);

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Payout"
      title="Withdraw funds"
      description="Requests are reviewed by Kay admin. Bank details must be complete in Settings."
    >
      <WithdrawForm available={wallet.available} />
    </DashboardLayout>
  );
}
