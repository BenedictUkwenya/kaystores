import { createAdminClient } from "@/lib/supabase/admin";
import { sendKayEmail } from "@/lib/email/send";
import type { AuthOtpAction } from "@/lib/email/types";

export type AuthOtpResult =
  | { ok: true; verifyType: "signup" | "recovery" | "email" }
  | { ok: false; error: string; status?: number };

async function findUserByEmail(email: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const found = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalized,
    );
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

async function emailOtp(
  to: string,
  token: string,
  action: AuthOtpAction,
  verifyType: "signup" | "recovery" | "email",
): Promise<AuthOtpResult> {
  const result = await sendKayEmail({
    type: "auth_otp",
    to,
    token,
    action,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error || "Could not send verification email.",
      status: 502,
    };
  }
  return { ok: true, verifyType };
}

/**
 * Create (or refresh) an unconfirmed account and send the OTP via Resend.
 * Uses admin generateLink — Supabase does not send mail, so Auth email rate limits do not apply.
 */
export async function registerWithResendOtp(input: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<AuthOtpResult> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error: "Auth is not configured on the server.",
      status: 503,
    };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const fullName = input.fullName?.trim();

  if (!email || password.length < 8) {
    return {
      ok: false,
      error: "Valid email and password (8+ characters) are required.",
      status: 400,
    };
  }

  let link = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  });

  if (link.error) {
    const existing = await findUserByEmail(email);
    if (existing?.email_confirmed_at) {
      return {
        ok: false,
        error: "An account with this email already exists. Please sign in.",
        status: 409,
      };
    }

    if (existing) {
      // Incomplete prior signup — replace so we can issue a fresh OTP.
      await admin.auth.admin.deleteUser(existing.id);
      link = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: fullName ? { data: { full_name: fullName } } : undefined,
      });
    }
  }

  if (link.error || !link.data.properties?.email_otp) {
    return {
      ok: false,
      error: link.error?.message ?? "Could not start registration.",
      status: 400,
    };
  }

  return emailOtp(email, link.data.properties.email_otp, "signup", "signup");
}

/** Password reset or resend signup code — OTP delivered only via Resend. */
export async function sendResendAuthOtp(input: {
  email: string;
  action: AuthOtpAction;
}): Promise<AuthOtpResult> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error: "Auth is not configured on the server.",
      status: 503,
    };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "Email is required.", status: 400 };
  }

  if (input.action === "recovery") {
    const link = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (link.error || !link.data.properties?.email_otp) {
      // Do not leak whether the account exists.
      return { ok: true, verifyType: "recovery" };
    }
    return emailOtp(
      email,
      link.data.properties.email_otp,
      "recovery",
      "recovery",
    );
  }

  // Resend signup verification for an existing unconfirmed user.
  const existing = await findUserByEmail(email);
  if (!existing) {
    return {
      ok: false,
      error: "No pending signup found for this email. Please sign up again.",
      status: 404,
    };
  }
  if (existing.email_confirmed_at) {
    return {
      ok: false,
      error: "This email is already verified. Please sign in.",
      status: 409,
    };
  }

  const link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (link.error || !link.data.properties?.email_otp) {
    return {
      ok: false,
      error: link.error?.message ?? "Could not send a new code.",
      status: 400,
    };
  }

  // magiclink OTP verifies with type "email"
  return emailOtp(email, link.data.properties.email_otp, "signup", "email");
}
