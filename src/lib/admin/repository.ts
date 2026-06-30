import { createAdminClient } from "@/lib/supabase/admin";
import { countAllAuthUsers } from "@/lib/admin/users";
import { mapVendorRow } from "@/lib/auth/roles";
import type { AdminOverview, Vendor, WithdrawalRequest } from "@/types/dashboard";
import type { Product } from "@/types/product";
import { mapProductRow } from "@/types/product";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("Admin client not configured");
  return client;
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const db = admin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [
    ordersRes,
    vendorsRes,
    productsRes,
    withdrawalsRes,
    conciergeRes,
  ] = await Promise.all([
    db.from("orders").select("pricing, created_at").gte("created_at", todayIso),
    db.from("vendors").select("id", { count: "exact", head: true }),
    db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "live"),
    db
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("concierge_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const orders = ordersRes.data ?? [];
  const gmvToday = orders.reduce((sum, o) => {
    const pricing = o.pricing as { grandTotal?: number } | null;
    return sum + (pricing?.grandTotal ?? 0);
  }, 0);

  const pendingApps = await db
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const totalUsers = await countAllAuthUsers();

  return {
    ordersToday: orders.length,
    gmvToday,
    pendingVendorApplications: pendingApps.count ?? 0,
    pendingWithdrawals: withdrawalsRes.count ?? 0,
    pendingConcierge: conciergeRes.count ?? 0,
    totalVendors: vendorsRes.count ?? 0,
    liveProducts: productsRes.count ?? 0,
    totalUsers,
  };
}

export async function fetchAllVendors(status?: string): Promise<Vendor[]> {
  const db = admin();
  let q = db.from("vendors").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapVendorRow);
}

export async function fetchVendorById(id: string): Promise<Vendor | null> {
  const db = admin();
  const { data, error } = await db.from("vendors").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapVendorRow(data);
}

export async function approveVendor(
  vendorId: string,
  adminUserId: string,
  canListAfterDark: boolean,
): Promise<void> {
  const db = admin();
  const { data: vendor, error: fetchErr } = await db
    .from("vendors")
    .select("user_id")
    .eq("id", vendorId)
    .single();
  if (fetchErr || !vendor) throw new Error("Vendor not found");

  const { error } = await db
    .from("vendors")
    .update({
      status: "approved",
      can_list_after_dark: canListAfterDark,
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);

  await db.from("profiles").update({ role: "vendor" }).eq("id", vendor.user_id);
}

export async function rejectVendor(vendorId: string): Promise<void> {
  const db = admin();
  const { error } = await db
    .from("vendors")
    .update({ status: "rejected" })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);
}

export async function suspendVendor(vendorId: string): Promise<void> {
  const db = admin();
  const { error } = await db
    .from("vendors")
    .update({ status: "suspended" })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);
}

export async function createVendorInvite(input: {
  email: string;
  businessName: string;
  invitedBy: string;
}): Promise<{ token: string; vendorId: string }> {
  const db = admin();
  const token = crypto.randomUUID();
  const email = input.email.trim().toLowerCase();

  let userId: string | undefined;

  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: input.businessName },
  });

  if (created?.user?.id) {
    userId = created.user.id;
  } else if (createErr?.message?.includes("already")) {
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 50 });
    const existing = list?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );
    userId = existing?.id;
  }

  if (!userId) {
    throw new Error(createErr?.message ?? "Could not create or find user for invite");
  }

  await db.from("profiles").upsert({ id: userId, role: "customer" }, { onConflict: "id" });

  const { data: existingVendor } = await db
    .from("vendors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVendor) {
    await db
      .from("vendors")
      .update({
        invite_token: token,
        invited_by: input.invitedBy,
        business_name: input.businessName,
      })
      .eq("id", existingVendor.id);
    return { token, vendorId: existingVendor.id };
  }

  const { data, error } = await db
    .from("vendors")
    .insert({
      user_id: userId,
      business_name: input.businessName,
      contact_name: input.businessName,
      contact_email: email,
      status: "pending",
      invite_token: token,
      invited_by: input.invitedBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { token, vendorId: data.id };
}

export async function fetchPendingProducts(): Promise<Product[]> {
  const db = admin();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProductRow);
}

export async function reviewProduct(
  productId: string,
  approved: boolean,
  adminUserId: string,
  rejectionReason?: string,
): Promise<void> {
  const db = admin();
  const { error } = await db
    .from("products")
    .update({
      status: approved ? "live" : "rejected",
      rejection_reason: approved ? null : rejectionReason ?? "Does not meet standards",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function fetchPendingWithdrawals(): Promise<WithdrawalRequest[]> {
  const db = admin();
  const { data, error } = await db
    .from("withdrawal_requests")
    .select("*, vendors(business_name, contact_email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    vendorId: String(row.vendor_id),
    amount: Number(row.amount),
    status: row.status,
    bankSnapshot: (row.bank_snapshot as Record<string, string>) ?? {},
    adminNote: row.admin_note,
    paymentReference: row.payment_reference,
    paidAt: row.paid_at,
    createdAt: String(row.created_at),
    vendor: row.vendors
      ? {
          businessName: String((row.vendors as { business_name: string }).business_name),
          contactEmail: String((row.vendors as { contact_email: string }).contact_email),
        }
      : undefined,
  }));
}

export async function updateWithdrawal(
  id: string,
  update: {
    status: WithdrawalRequest["status"];
    adminNote?: string;
    paymentReference?: string;
  },
): Promise<void> {
  const db = admin();
  const payload: Record<string, unknown> = {
    status: update.status,
    admin_note: update.adminNote ?? null,
    payment_reference: update.paymentReference ?? null,
  };
  if (update.status === "paid") {
    payload.paid_at = new Date().toISOString();
  }
  const { error } = await db.from("withdrawal_requests").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  if (update.status === "paid") {
    const { data: withdrawal } = await db
      .from("withdrawal_requests")
      .select("vendor_id, amount")
      .eq("id", id)
      .single();
    if (withdrawal) {
      const { data: earnings } = await db
        .from("vendor_earnings")
        .select("id, net_amount")
        .eq("vendor_id", withdrawal.vendor_id)
        .eq("status", "available")
        .order("created_at", { ascending: true });

      let remaining = Number(withdrawal.amount);
      for (const e of earnings ?? []) {
        if (remaining <= 0) break;
        const net = Number(e.net_amount);
        if (net <= remaining) {
          await db
            .from("vendor_earnings")
            .update({ status: "paid_out" })
            .eq("id", e.id);
          remaining -= net;
        }
      }
    }
  }
}

export async function fetchAllOrdersAdmin(limit = 50) {
  const db = admin();
  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateOrderAdmin(
  orderId: string,
  update: {
    status?: string;
    paymentStatus?: string;
    paymentReference?: string;
    trackingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  },
): Promise<void> {
  const db = admin();
  const payload: Record<string, unknown> = {};
  if (update.status) payload.status = update.status;
  if (update.paymentStatus) {
    payload.payment_status = update.paymentStatus;
    if (update.paymentStatus === "paid") {
      payload.paid_at = new Date().toISOString();
    }
  }
  if (update.paymentReference) payload.payment_reference = update.paymentReference;
  if (update.trackingCarrier !== undefined)
    payload.tracking_carrier = update.trackingCarrier;
  if (update.trackingNumber !== undefined)
    payload.tracking_number = update.trackingNumber;
  if (update.trackingUrl !== undefined) payload.tracking_url = update.trackingUrl;

  const { error } = await db.from("orders").update(payload).eq("id", orderId);
  if (error) throw new Error(error.message);

  if (update.paymentStatus === "paid") {
    await db
      .from("vendor_order_items")
      .update({ fulfillment_status: "awaiting_hub_delivery" })
      .eq("order_id", orderId)
      .eq("fulfillment_status", "awaiting_payment");
  }
}

export async function fetchConciergeRequests() {
  const db = admin();
  const { data, error } = await db
    .from("concierge_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateConciergeRequest(
  id: string,
  update: { status?: string; adminNotes?: string },
) {
  const db = admin();
  const { error } = await db
    .from("concierge_requests")
    .update({
      status: update.status,
      admin_notes: update.adminNotes,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function exportOrdersCsv(): Promise<string> {
  const orders = await fetchAllOrdersAdmin(500);
  const header = "order_number,status,payment_status,grand_total,created_at,buyer_email";
  const rows = orders.map((o) => {
    const pricing = o.pricing as { grandTotal?: number } | null;
    const buyer = o.buyer as { email?: string } | null;
    return [
      o.order_number,
      o.status,
      o.payment_status ?? "unpaid",
      pricing?.grandTotal ?? o.subtotal,
      o.created_at,
      buyer?.email ?? "",
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
