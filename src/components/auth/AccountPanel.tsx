"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { AccountGuestView } from "@/components/account/AccountGuestView";
import type { OrderSummary } from "@/types/order";
import type { ClientConciergeStatus } from "@/types/concierge";
import type { Vendor } from "@/types/dashboard";
import { readVendorApplyDraft } from "@/lib/vendor/apply-draft";

type Props = {
  initialUser: User | null;
  initialOrders: OrderSummary[];
  initialConciergeRequests: ClientConciergeStatus[];
  initialVendorApplication: Vendor | null;
};

function AccountSkeleton() {
  return (
    <div className="mx-auto max-w-[1100px] animate-pulse px-6 py-10 sm:px-10">
      <div className="h-3 w-32 rounded bg-kay-border-light" />
      <div className="mt-8 h-10 w-2/3 max-w-md rounded bg-kay-border-light" />
      <div className="mt-4 h-4 w-full max-w-lg rounded bg-kay-border-light" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="h-64 rounded-2xl bg-kay-border-light/60" />
        <div className="h-48 rounded-2xl bg-kay-border-light/40" />
      </div>
    </div>
  );
}

export function AccountPanel({
  initialUser,
  initialOrders,
  initialConciergeRequests,
  initialVendorApplication,
}: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [conciergeRequests, setConciergeRequests] = useState<
    ClientConciergeStatus[]
  >(initialConciergeRequests);
  const [vendorApplication] = useState<Vendor | null>(
    initialVendorApplication,
  );
  const [loading, setLoading] = useState(!initialUser && !initialOrders.length);

  useEffect(() => {
    // Finish vendor signup draft after verify if user landed on account.
    if (!initialUser) return;
    if (initialVendorApplication) return;
    if (readVendorApplyDraft()) {
      router.replace("/vendor/apply");
    }
  }, [initialUser, initialVendorApplication, router]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setOrders([]);
        setConciergeRequests([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [initialUser]);

  useEffect(() => {
    if (!user) return;

    if (initialOrders.length === 0) {
      fetch("/api/orders/mine")
        .then((res) => (res.ok ? res.json() : { orders: [] }))
        .then((data) => setOrders(data.orders ?? []))
        .catch(() => {});
    }

    if (initialConciergeRequests.length === 0) {
      fetch("/api/concierge/mine")
        .then((res) => (res.ok ? res.json() : { requests: [] }))
        .then((data) => setConciergeRequests(data.requests ?? []))
        .catch(() => {});
    }
  }, [user, initialOrders.length, initialConciergeRequests.length]);

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <AccountSkeleton />;
  }

  if (!user) {
    return <AccountGuestView />;
  }

  return (
    <AccountDashboard
      user={user}
      orders={orders}
      conciergeRequests={conciergeRequests}
      vendorApplication={vendorApplication}
      onSignOut={handleSignOut}
    />
  );
}
