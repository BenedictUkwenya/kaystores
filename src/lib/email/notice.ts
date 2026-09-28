import { createAdminClient } from "@/lib/supabase/admin";
import { listAdminEmails } from "@/lib/email/admins";
import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";
import type { NoticeEmailPayload } from "@/lib/email/types";

export async function sendNotice(
  input: Omit<NoticeEmailPayload, "appUrl" | "adminEmails">,
) {
  const adminEmails = input.toTeam ? await listAdminEmails() : undefined;
  const result = await sendKayEmail({
    ...input,
    appUrl: getEmailSiteUrl(),
    adminEmails,
  });
  if (!result.ok && !("skipped" in result && result.skipped)) {
    console.error(`[email:${input.type}]`, result.error);
  }
  return result;
}

const CHAT_THROTTLE_MS = 10 * 60 * 1000;

/**
 * True when this recipient may be emailed about this thread now
 * (records the send). Fails open if the log table is missing.
 */
export async function claimChatNotification(
  threadKey: string,
  recipient: string,
): Promise<boolean> {
  const db = createAdminClient();
  if (!db) return false;
  const now = new Date();
  const { data, error } = await db
    .from("chat_notification_log")
    .select("notified_at")
    .eq("thread_key", threadKey)
    .eq("recipient", recipient)
    .maybeSingle();
  if (error) return true;
  if (
    data?.notified_at &&
    now.getTime() - new Date(String(data.notified_at)).getTime() <
      CHAT_THROTTLE_MS
  ) {
    return false;
  }
  await db
    .from("chat_notification_log")
    .upsert(
      { thread_key: threadKey, recipient, notified_at: now.toISOString() },
      { onConflict: "thread_key,recipient" },
    );
  return true;
}
