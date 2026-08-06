import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "npm:standardwebhooks@1.0.0";

type AuthEmailPayload = {
  user: { email: string };
  email_data: {
    token: string;
    email_action_type: string;
  };
};

function siteUrl(): string {
  const fromEnv = Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "");
  if (fromEnv && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(fromEnv)) {
    return fromEnv;
  }
  return "https://kaystores.vercel.app";
}

function layout(title: string, body: string, opts?: { omitExpiry?: boolean }) {
  const expiry = opts?.omitExpiry
    ? ""
    : `<p style="margin-top:28px;font-size:11px;color:#8a8a8a">This code expires in 1 hour. If you didn't request this, you can ignore this email.</p>`;
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f9f7f2;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #eceae4;border-radius:12px;padding:32px">
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#b89a6a">Kay Stores</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:400;color:#000">${title}</h1>
    ${body}
    ${expiry}
    <p style="margin-top:8px;font-size:11px;color:#8a8a8a">Kay Stores · Luxury gifting</p>
  </div></body></html>`;
}

function messageForAction(
  action: string,
  token: string,
): { subject: string; html: string } {
  const code = `<p style="margin:24px 0;font-size:32px;letter-spacing:0.35em;font-weight:600;color:#000;text-align:center">${token}</p>`;
  const signupUrl = `${siteUrl()}/signup`;

  switch (action) {
    case "signup":
      return {
        subject: "Verify your Kay account",
        html: layout(
          "Your verification code",
          `<p style="color:#5c5c5c;line-height:1.6">Welcome to Kay. Enter this code on the verification screen to finish creating your account:</p>${code}`,
        ),
      };
    case "recovery":
      return {
        subject: "Reset your Kay password",
        html: layout(
          "Password reset code",
          `<p style="color:#5c5c5c;line-height:1.6">Enter this code to reset your password:</p>${code}`,
        ),
      };
    case "magiclink":
      return {
        subject: "Your Kay sign-in code",
        html: layout(
          "Sign-in code",
          `<p style="color:#5c5c5c;line-height:1.6">Enter this code to sign in:</p>${code}`,
        ),
      };
    case "email_change":
      return {
        subject: "Confirm your new email — Kay",
        html: layout(
          "Confirm email change",
          `<p style="color:#5c5c5c;line-height:1.6">Enter this code to confirm your new email address:</p>${code}`,
        ),
      };
    case "invite":
      // Vendor/admin invites use send-email (role_invite) with a personal signup URL.
      // If this auth hook still fires, give a usable live-site button — not a dead OTP.
      return {
        subject: "You're invited to Kay Stores",
        html: layout(
          "Complete your Kay registration",
          `<p style="color:#5c5c5c;line-height:1.6">Create your account on Kay Stores with your name and password. If you received a separate invitation with a personal link, use that instead.</p>
          <p style="margin:24px 0 12px">
            <a href="${signupUrl}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;padding:14px 22px;border-radius:999px">Create your account</a>
          </p>
          <p style="color:#5c5c5c;font-size:12px;line-height:1.5;word-break:break-all">Or open: <a href="${signupUrl}" style="color:#b89a6a;text-decoration:underline">${signupUrl}</a></p>`,
          { omitExpiry: true },
        ),
      };
    default:
      return {
        subject: "Your Kay verification code",
        html: layout(
          "Verification code",
          `<p style="color:#5c5c5c;line-height:1.6">Enter this code to continue:</p>${code}`,
        ),
      };
  }
}

async function sendResend(
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { error: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { error: data?.message ?? `Resend error ${res.status}` };
  }
  return {};
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!hookSecretRaw) {
    return new Response(
      JSON.stringify({ error: { message: "SEND_EMAIL_HOOK_SECRET not set" } }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const hookSecret = hookSecretRaw.replace("v1,whsec_", "");
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let verified: AuthEmailPayload;
  try {
    const wh = new Webhook(hookSecret);
    verified = wh.verify(payload, headers) as AuthEmailPayload;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const from =
    Deno.env.get("RESEND_FROM_EMAIL") ?? "Kay Stores <onboarding@resend.dev>";
  const { subject, html } = messageForAction(
    verified.email_data.email_action_type,
    verified.email_data.token,
  );

  const result = await sendResend(
    from,
    verified.user.email,
    subject,
    html,
  );

  if (result.error) {
    return new Response(
      JSON.stringify({ error: { message: result.error } }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
