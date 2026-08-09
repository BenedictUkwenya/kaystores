import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";

export async function notifySupportMessage(input: {
  audience: "team" | "user";
  to?: string;
  preview: string;
  senderName?: string;
  threadId: string;
}) {
  const appUrl = getEmailSiteUrl();
  const deepLink =
    input.audience === "team"
      ? `${appUrl}/admin/support?thread=${input.threadId}`
      : `${appUrl}/support`;

  return sendKayEmail({
    type: "support_message",
    appUrl,
    audience: input.audience,
    to: input.to,
    preview: input.preview.slice(0, 280),
    senderName: input.senderName,
    deepLink,
    threadId: input.threadId,
  });
}
