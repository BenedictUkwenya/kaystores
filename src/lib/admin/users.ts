import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import type { AccountStatus, AdminUser, UserRole } from "@/types/dashboard";
import { getEmailSiteUrl } from "@/lib/site";
import { sendKayEmail } from "@/lib/email/send";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("Admin client not configured");
  return client;
}

async function findUserByEmail(email: string) {
  const db = admin();
  const normalized = email.trim().toLowerCase();

  const { data, error } = await db.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (!error && data?.users?.length) {
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    );
    if (match) return match;
  }

  let page = 1;
  while (page <= 20) {
    const { data: pageData, error: pageErr } = await db.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (pageErr) throw new Error(pageErr.message);

    const match = pageData.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    );
    if (match) return match;

    if (pageData.users.length < 100) break;
    page += 1;
  }

  return null;
}

function mapAdminUser(
  profile: Record<string, unknown>,
  email: string,
  vendor?: Record<string, unknown> | null,
  authCreatedAt?: string,
): AdminUser {
  return {
    id: String(profile.id),
    email,
    fullName: profile.full_name != null ? String(profile.full_name) : null,
    phone: profile.phone != null ? String(profile.phone) : null,
    role: profile.role as UserRole,
    accountStatus: (profile.account_status as AccountStatus) ?? "active",
    statusReason:
      profile.status_reason != null ? String(profile.status_reason) : null,
    createdAt: String(profile.created_at ?? authCreatedAt ?? new Date().toISOString()),
    vendorStatus: vendor ? (vendor.status as AdminUser["vendorStatus"]) : null,
    businessName:
      vendor?.business_name != null ? String(vendor.business_name) : null,
  };
}

async function listAllAuthUsers(): Promise<User[]> {
  const db = admin();
  const users: User[] = [];
  let page = 1;

  while (page <= 20) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 100) break;
    page += 1;
  }

  return users;
}

/** Ensure every auth user has a profiles row (backfill orphans). */
async function ensureProfilesForAuthUsers(
  authUsers: User[],
  profileById: Map<string, Record<string, unknown>>,
) {
  const missing = authUsers.filter(
    (u) => u.email && !profileById.has(u.id),
  );

  if (missing.length === 0) return;

  const db = admin();
  const rows = missing.map((u) => ({
    id: u.id,
    full_name: String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? ""),
    role: "customer" as const,
  }));

  const { error } = await db.from("profiles").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);

  const { data: refreshed } = await db.from("profiles").select("*");
  profileById.clear();
  for (const p of refreshed ?? []) {
    profileById.set(String(p.id), p);
  }
}

export async function countAllAuthUsers(): Promise<number> {
  const users = await listAllAuthUsers();
  return users.filter((u) => u.email).length;
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const db = admin();
  const authUsers = await listAllAuthUsers();

  const { data: profiles, error } = await db.from("profiles").select("*");
  if (error) throw new Error(error.message);

  const profileById = new Map(
    (profiles ?? []).map((p) => [String(p.id), p as Record<string, unknown>]),
  );

  await ensureProfilesForAuthUsers(authUsers, profileById);

  const { data: vendors } = await db.from("vendors").select("*");
  const vendorByUserId = new Map(
    (vendors ?? []).map((v) => [String(v.user_id), v]),
  );

  return authUsers
    .filter((u) => u.email)
    .map((authUser) => {
      const profile = profileById.get(authUser.id) ?? {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name ?? "",
        role: "customer",
        account_status: "active",
        created_at: authUser.created_at,
      };

      return mapAdminUser(
        profile as Record<string, unknown>,
        authUser.email!,
        vendorByUserId.get(authUser.id),
        authUser.created_at,
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function updateUserAccountStatus(
  userId: string,
  accountStatus: AccountStatus,
  adminUserId: string,
  reason?: string,
): Promise<void> {
  if (userId === adminUserId && accountStatus !== "active") {
    throw new Error("You cannot suspend or block your own account.");
  }

  const db = admin();
  const { error } = await db
    .from("profiles")
    .update({
      account_status: accountStatus,
      status_reason: reason ?? null,
      status_changed_at: new Date().toISOString(),
      status_changed_by: adminUserId,
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function upgradeUserToAdmin(
  userId: string,
  _adminUserId: string,
): Promise<void> {
  const db = admin();
  const { data: authUser } = await db.auth.admin.getUserById(userId);

  const { error } = await db.from("profiles").upsert(
    {
      id: userId,
      full_name: String(
        authUser.user?.user_metadata?.full_name ??
          authUser.user?.email?.split("@")[0] ??
          "",
      ),
      role: "admin",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(error.message);
}

export async function promoteUserToVendor(
  userId: string,
  adminUserId: string,
  businessName: string,
): Promise<void> {
  const db = admin();
  const { data: authUser } = await db.auth.admin.getUserById(userId);
  const email = authUser.user?.email;
  if (!email) throw new Error("User email not found");

  const name = businessName.trim() || email.split("@")[0];

  const { data: existing } = await db
    .from("vendors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("vendors")
      .update({
        status: "approved",
        business_name: name,
        onboarding_source: "invite",
        invite_token: null,
        approved_at: new Date().toISOString(),
        approved_by: adminUserId,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("vendors").insert({
      user_id: userId,
      business_name: name,
      contact_name: name,
      contact_email: email,
      status: "approved",
      onboarding_source: "invite",
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    });
    if (error) throw new Error(error.message);
  }

  const { error: profileErr } = await db
    .from("profiles")
    .update({ role: "vendor", updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileErr) throw new Error(profileErr.message);
}

export async function demoteUserToCustomer(
  userId: string,
  adminUserId: string,
): Promise<void> {
  if (userId === adminUserId) {
    throw new Error("You cannot demote your own admin account.");
  }

  const db = admin();
  const { error } = await db
    .from("profiles")
    .update({ role: "customer", updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export type InviteResult =
  | { action: "upgraded"; userId: string; role: "admin" | "vendor" }
  | { action: "invited"; token: string; inviteUrl: string; email: string; role: "admin" | "vendor" };

export async function inviteUserByRole(input: {
  email: string;
  role: "admin" | "vendor";
  businessName?: string;
  inviteMode?: "instant" | "profile";
  invitedBy: string;
}): Promise<InviteResult> {
  const db = admin();
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    if (input.role === "admin") {
      await upgradeUserToAdmin(existing.id, input.invitedBy);
      await sendKayEmail({
        type: "role_upgraded",
        appUrl: getEmailSiteUrl(),
        recipientEmail: email,
        recipientName: existing.user_metadata?.full_name as string | undefined,
        role: "admin",
      });
      return { action: "upgraded", userId: existing.id, role: "admin" };
    }

    await promoteUserToVendor(
      existing.id,
      input.invitedBy,
      input.businessName ?? email.split("@")[0],
    );
    await sendKayEmail({
      type: "role_upgraded",
      appUrl: getEmailSiteUrl(),
      recipientEmail: email,
      recipientName: existing.user_metadata?.full_name as string | undefined,
      role: "vendor",
    });
    return { action: "upgraded", userId: existing.id, role: "vendor" };
  }

  const token = crypto.randomUUID();
  const inviteMode =
    input.role === "vendor"
      ? (input.inviteMode === "instant" ? "instant" : "profile")
      : undefined;
  const businessName = input.businessName ?? email.split("@")[0];
  const metadata =
    input.role === "vendor"
      ? { business_name: businessName, inviteMode }
      : {};

  const { error: inviteErr } = await db.from("role_invites").insert({
    email,
    invite_role: input.role,
    token,
    invited_by: input.invitedBy,
    metadata,
  });

  if (inviteErr) throw new Error(inviteErr.message);

  const siteUrl = getEmailSiteUrl();
  const inviteUrl =
    input.role === "admin"
      ? `${siteUrl}/signup?invite=${token}&role=admin`
      : `${siteUrl}/signup?invite=${token}&role=vendor&mode=${inviteMode}`;

  // Only our Resend role_invite email — never auth.admin.inviteUserByEmail.
  // That API sends an OTP "Accept your invitation" mail with no signup link,
  // and pre-creates an auth user so signUp on the invite URL fails.
  // Vendor rows are created when they register via redeem_role_invites_for_user.
  const emailResult = await sendKayEmail({
    type: "role_invite",
    appUrl: siteUrl,
    recipientEmail: email,
    role: input.role,
    inviteUrl,
    businessName: input.businessName,
  });

  if (!emailResult.ok && !emailResult.skipped) {
    console.error("[invite] role_invite email failed:", emailResult.error);
  }

  return { action: "invited", token, inviteUrl, email, role: input.role };
}

export async function redeemInvitesForUser(
  userId: string,
  email: string,
): Promise<void> {
  const db = admin();
  const { error } = await db.rpc("redeem_role_invites_for_user", {
    p_user_id: userId,
    p_email: email,
  });
  if (error) throw new Error(error.message);
}

export async function getAccountStatus(
  userId: string,
): Promise<AccountStatus | null> {
  const db = admin();
  const { data } = await db
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .maybeSingle();
  return (data?.account_status as AccountStatus) ?? null;
}
