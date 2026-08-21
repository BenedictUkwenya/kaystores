import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole, Vendor } from "@/types/dashboard";

export type AuthContext = {
  userId: string;
  email: string;
  profile: Profile;
  vendor: Vendor | null;
};

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    role: row.role as UserRole,
    fullName: row.full_name != null ? String(row.full_name) : null,
    phone: row.phone != null ? String(row.phone) : null,
    createdAt: String(row.created_at),
  };
}

export function mapVendorRow(row: Record<string, unknown>): Vendor {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    businessName: String(row.business_name),
    contactName: String(row.contact_name),
    contactEmail: String(row.contact_email),
    contactPhone: String(row.contact_phone ?? ""),
    catalogDescription: String(row.catalog_description ?? ""),
    nin: row.nin != null ? String(row.nin) : null,
    onboardingSource:
      row.onboarding_source === "invite" ? "invite" : "self_apply",
    status: row.status as Vendor["status"],
    canListAfterDark: Boolean(row.can_list_after_dark),
    bankName: row.bank_name != null ? String(row.bank_name) : null,
    accountNumber: row.account_number != null ? String(row.account_number) : null,
    accountName: row.account_name != null ? String(row.account_name) : null,
    inviteToken: row.invite_token != null ? String(row.invite_token) : null,
    approvedAt: row.approved_at != null ? String(row.approved_at) : null,
    createdAt: String(row.created_at),
    pickupAddress:
      row.pickup_address && typeof row.pickup_address === "object"
        ? (row.pickup_address as Vendor["pickupAddress"])
        : null,
    returnAddress:
      row.return_address && typeof row.return_address === "object"
        ? (row.return_address as Vendor["returnAddress"])
        : null,
  };
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data);
}

export async function getVendorByUserId(userId: string): Promise<Vendor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapVendorRow(data);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getSessionUser();
  if (!user?.email) return null;

  const profile = await getProfile(user.id);
  if (!profile) return null;

  const vendor =
    profile.role === "vendor" || profile.role === "admin"
      ? await getVendorByUserId(user.id)
      : await getVendorByUserId(user.id);

  return {
    userId: user.id,
    email: user.email,
    profile,
    vendor,
  };
}

export async function requireRole(
  allowed: UserRole[],
): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new AuthError("Unauthorized", 401);
  }
  if (!allowed.includes(ctx.profile.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return ctx;
}

export async function requireVendor(): Promise<AuthContext & { vendor: Vendor }> {
  const ctx = await requireRole(["vendor", "admin"]);
  if (!ctx.vendor || ctx.vendor.status !== "approved") {
    if (ctx.profile.role === "admin") {
      throw new AuthError("Admin must use admin routes for vendor actions", 403);
    }
    throw new AuthError("Vendor account not approved", 403);
  }
  return { ...ctx, vendor: ctx.vendor };
}

export async function requireAdmin(): Promise<AuthContext> {
  return requireRole(["admin"]);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function apiErrorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Server error";
  return Response.json({ error: message }, { status: 500 });
}

/** Middleware helper — fetch role via admin client for speed */
export async function getProfileRole(userId: string): Promise<UserRole | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as UserRole) ?? null;
}
