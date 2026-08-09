import { createClient } from "@/lib/supabase/server";
import { AccountPanel } from "@/components/auth/AccountPanel";
import {
  fetchOrdersForAccount,
  isSupabaseOrdersEnabled,
} from "@/lib/orders/repository";
import { fetchConciergeRequestsForAccount } from "@/lib/concierge/repository";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { getVendorByUserId } from "@/lib/auth/roles";

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

  return (
    <AccountPanel
      initialUser={user}
      initialOrders={orders}
      initialConciergeRequests={conciergeRequests}
      initialVendorApplication={vendorApplication}
    />
  );
}
