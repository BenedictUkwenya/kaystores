import { createClient } from "@/lib/supabase/server";
import { AccountPanel } from "@/components/auth/AccountPanel";
import {
  fetchOrdersForAccount,
  isSupabaseOrdersEnabled,
} from "@/lib/orders/repository";
import { getSupabaseConfig } from "@/lib/supabase/env";

export default async function AccountPage() {
  if (!getSupabaseConfig().isConfigured) {
    return <AccountPanel initialUser={null} initialOrders={[]} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orders =
    user && isSupabaseOrdersEnabled() ? await fetchOrdersForAccount() : [];

  return <AccountPanel initialUser={user} initialOrders={orders} />;
}
