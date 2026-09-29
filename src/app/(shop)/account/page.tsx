import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AccountPanel } from "@/components/auth/AccountPanel";
import {
  fetchOrdersForAccount,
  isSupabaseOrdersEnabled,
} from "@/lib/orders/repository";
import { fetchConciergeRequestsForAccount } from "@/lib/concierge/repository";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { getVendorByUserId } from "@/lib/auth/roles";
import { listTableRequestsForAccount } from "@/lib/table/repository";
import type { AccountKitchenRequest } from "@/components/account/AccountKitchenRequests";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  if (!getSupabaseConfig().isConfigured) {
    return (
      <AccountPanel
        initialUser={null}
        initialOrders={[]}
        initialConciergeRequests={[]}
        initialVendorApplication={null}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orders =
    user && isSupabaseOrdersEnabled() ? await fetchOrdersForAccount() : [];

  const conciergeRequests = user
    ? await fetchConciergeRequestsForAccount({
        userId: user.id,
        email: user.email,
      })
    : [];

  const vendorApplication = user ? await getVendorByUserId(user.id) : null;

  const kitchenRequests: AccountKitchenRequest[] = user
    ? (
        await listTableRequestsForAccount({ userId: user.id, email: user.email }).catch(
          (err) => {
            console.error("[account] kitchen requests:", err);
            return [];
          },
        )
      ).map((r) => ({
        id: r.id,
        reference: r.reference,
        status: r.status,
        category: r.category,
        occasion: r.occasion ?? null,
        neededBy: r.neededBy ?? null,
        quoteAmount:
          r.status === "submitted" || r.status === "reviewing" ? null : r.quoteAmount ?? null,
        paid: r.paymentStatus === "paid",
        createdAt: r.createdAt,
      }))
    : [];

  return (
    <AccountPanel
      initialUser={user}
      initialOrders={orders}
      initialConciergeRequests={conciergeRequests}
      kitchenRequests={kitchenRequests}
      initialVendorApplication={vendorApplication}
    />
  );
}
