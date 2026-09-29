import type { AuthOtpAction } from "@/lib/email/types";
import type { RoleEmailPayload } from "@/lib/email/types";
import { getEmailSiteUrl } from "@/lib/site";
import type { SendEmailResult } from "@/lib/email/send";

function emailLayout(title: string, body: string): string {
  const logo = `${getEmailSiteUrl()}/brand/email-logo.png`;
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f9f7f2;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #eceae4;border-radius:12px;padding:32px">
    <div style="margin:0 0 20px;text-align:left">
      <img src="${logo}" width="48" height="48" alt="Kay Stores" style="display:block;width:48px;height:48px;border:0;outline:none" />
      <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#b89a6a">Kay Stores</p>
    </div>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:400;color:#000">${title}</h1>
    ${body}
    <p style="margin-top:28px;font-size:11px;color:#8a8a8a">Kay Stores · Luxury gifting</p>
  </div></body></html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0 12px">
  <a href="${href}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;padding:14px 22px;border-radius:999px">${label}</a>
</p>
<p style="color:#5c5c5c;font-size:12px;line-height:1.5;word-break:break-all">Or open this link:<br/><a href="${href}" style="color:#b89a6a;text-decoration:underline">${href}</a></p>`;
}

async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: { name: string; value: string }[];
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY not set on server" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ??
    "Kay Stores <hello@shoponkay.com>";
  const replyTo =
    process.env.KAY_REPLY_TO_EMAIL?.trim() ??
    process.env.KAY_TEAM_EMAIL?.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(options.tags?.length ? { tags: options.tags } : {}),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data.message ?? `Resend error ${res.status}` };
  }
  return { ok: true, id: data.id };
}

export function canSendAuthEmailDirect(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendAuthOtpDirect(input: {
  to: string;
  token: string;
  action: AuthOtpAction;
}): Promise<SendEmailResult> {
  const code = `<p style="margin:24px 0;font-size:32px;letter-spacing:0.35em;font-weight:600;color:#000;text-align:center">${input.token}</p>`;
  const expiry = `<p style="margin-top:28px;font-size:11px;color:#8a8a8a">This code expires in 1 hour. If you didn't request this, you can ignore this email.</p>`;

  let title = "Verification code";
  let intro =
    `<p style="color:#5c5c5c;line-height:1.6">Enter this code to continue:</p>`;
  let subject = "Your Kay verification code";

  if (input.action === "signup") {
    title = "Your verification code";
    intro = `<p style="color:#5c5c5c;line-height:1.6">Welcome to Kay. Enter this code on the verification screen to finish creating your account:</p>`;
    subject = "Verify your Kay account";
  } else if (input.action === "recovery") {
    title = "Password reset code";
    intro = `<p style="color:#5c5c5c;line-height:1.6">Enter this code to reset your password:</p>`;
    subject = "Reset your Kay password";
  }

  const html = emailLayout(title, `${intro}${code}${expiry}`);
  return sendViaResend({
    to: input.to,
    subject,
    html,
    text: `${title}: ${input.token}`,
    tags: [{ name: "category", value: "auth_otp" }],
  });
}

export async function sendRoleEmailDirect(
  payload: RoleEmailPayload,
): Promise<SendEmailResult> {
  if (payload.type === "role_invite") {
    const roleLabel = payload.role === "admin" ? "Kay admin" : "Kay vendor";
    const href = payload.inviteUrl || `${payload.appUrl}/signup`;
    const title = payload.reminder
      ? `Reminder: join as ${roleLabel}`
      : `You're invited to join as ${roleLabel}`;
    const intro = payload.reminder
      ? `<p style="color:#5c5c5c;line-height:1.6">Just a reminder — you've been invited to join Kay Stores as <strong>${roleLabel}</strong>${payload.businessName ? ` for <strong>${payload.businessName}</strong>` : ""}. Use the button below to finish registering.</p>`
      : `<p style="color:#5c5c5c;line-height:1.6">You've been invited to join Kay Stores as <strong>${roleLabel}</strong>${payload.businessName ? ` for <strong>${payload.businessName}</strong>` : ""}.</p>`;
    const html = emailLayout(
      title,
      `${intro}${ctaButton(href, "Accept invitation & register")}`,
    );
    return sendViaResend({
      to: payload.recipientEmail,
      subject: payload.reminder
        ? `Reminder — ${roleLabel} invitation`
        : `Invitation — ${roleLabel} access`,
      html,
      text: `${payload.reminder ? "Reminder: " : ""}You're invited to join Kay Stores as ${roleLabel}.\n\nAccept here: ${href}\n`,
      tags: [{ name: "category", value: "role_invite" }],
    });
  }

  const roleLabel = payload.role === "admin" ? "admin" : "vendor";
  const portalUrl =
    payload.role === "admin"
      ? `${payload.appUrl}/admin`
      : `${payload.appUrl}/vendor`;
  const html = emailLayout(
    "Your access has been updated",
    `<p style="color:#5c5c5c;line-height:1.6">Hi ${payload.recipientName ?? "there"}, your Kay Stores account now has <strong>${roleLabel}</strong> access.</p>
    ${ctaButton(portalUrl, `Open ${roleLabel} portal`)}`,
  );
  return sendViaResend({
    to: payload.recipientEmail,
    subject: `You're now a Kay ${roleLabel}`,
    html,
    text: `Your Kay Stores account now has ${roleLabel} access.\n\nOpen portal: ${portalUrl}\n`,
    tags: [{ name: "category", value: "role_upgraded" }],
  });
}
