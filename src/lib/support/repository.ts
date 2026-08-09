import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SupportMessage,
  SupportSenderRole,
  SupportThread,
  SupportThreadListItem,
  SupportThreadStatus,
} from "@/types/support";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

function mapThread(row: Record<string, unknown>): SupportThread {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    subject: String(row.subject ?? "Kay Support"),
    status: row.status as SupportThreadStatus,
    lastMessageAt: String(row.last_message_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    senderId: String(row.sender_id),
    senderRole: row.sender_role as SupportSenderRole,
    body: row.body != null ? String(row.body) : null,
    imagePath: row.image_path != null ? String(row.image_path) : null,
    createdAt: String(row.created_at),
  };
}

export async function getOpenThreadForUser(
  userId: string,
): Promise<SupportThread | null> {
  const db = admin();
  const { data, error } = await db
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapThread(data) : null;
}

export async function getLatestClosedThreadForUser(
  userId: string,
): Promise<SupportThread | null> {
  const db = admin();
  const { data, error } = await db
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "closed")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapThread(data) : null;
}

export async function createSupportThread(
  userId: string,
  subject = "Kay Support",
): Promise<SupportThread> {
  const db = admin();
  const { data, error } = await db
    .from("support_threads")
    .insert({
      user_id: userId,
      subject,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapThread(data);
}

export async function reopenSupportThread(
  threadId: string,
): Promise<SupportThread> {
  const db = admin();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("support_threads")
    .update({
      status: "open",
      updated_at: now,
      last_message_at: now,
    })
    .eq("id", threadId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapThread(data);
}

/** Get open thread, or reopen the latest closed one, or create a new thread. */
export async function getOrCreateOpenThread(
  userId: string,
): Promise<SupportThread> {
  const open = await getOpenThreadForUser(userId);
  if (open) return open;

  const closed = await getLatestClosedThreadForUser(userId);
  if (closed) return reopenSupportThread(closed.id);

  return createSupportThread(userId);
}

export async function getThreadById(
  threadId: string,
): Promise<SupportThread | null> {
  const db = admin();
  const { data, error } = await db
    .from("support_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapThread(data) : null;
}

export async function listMessagesForThread(
  threadId: string,
): Promise<SupportMessage[]> {
  const db = admin();
  const { data, error } = await db
    .from("support_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMessage(row));
}

export async function insertSupportMessage(input: {
  threadId: string;
  senderId: string;
  senderRole: SupportSenderRole;
  body: string | null;
  imagePath: string | null;
}): Promise<SupportMessage> {
  const db = admin();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("support_messages")
    .insert({
      thread_id: input.threadId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      body: input.body,
      image_path: input.imagePath,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { error: threadError } = await db
    .from("support_threads")
    .update({
      last_message_at: now,
      updated_at: now,
      status: "open",
    })
    .eq("id", input.threadId);

  if (threadError) throw new Error(threadError.message);

  return mapMessage(data);
}

export async function closeSupportThread(threadId: string): Promise<void> {
  const db = admin();
  const { error } = await db
    .from("support_threads")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  if (error) throw new Error(error.message);
}

export async function listSupportThreads(): Promise<SupportThreadListItem[]> {
  const db = admin();
  const { data, error } = await db
    .from("support_threads")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(error.message);

  const threads = (data ?? []).map((row) => mapThread(row));
  if (threads.length === 0) return [];

  const userIds = [...new Set(threads.map((t) => t.userId))];
  const threadIds = threads.map((t) => t.id);

  const [{ data: profiles }, { data: lastMessages }] = await Promise.all([
    db
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds),
    db
      .from("support_messages")
      .select("thread_id, body, sender_role, image_path, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [String(p.id), p]),
  );

  const latestByThread = new Map<
    string,
    {
      body: string | null;
      sender_role: SupportSenderRole;
      image_path: string | null;
    }
  >();
  for (const msg of lastMessages ?? []) {
    const tid = String(msg.thread_id);
    if (latestByThread.has(tid)) continue;
    latestByThread.set(tid, {
      body: msg.body != null ? String(msg.body) : null,
      sender_role: msg.sender_role as SupportSenderRole,
      image_path: msg.image_path != null ? String(msg.image_path) : null,
    });
  }

  // Resolve emails via auth admin when possible
  const emailMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await db.auth.admin.getUserById(id);
      if (data?.user?.email) emailMap.set(id, data.user.email);
    }),
  );

  return threads.map((thread) => {
    const latest = latestByThread.get(thread.id);
    const profile = profileMap.get(thread.userId);
    const preview =
      latest?.body?.trim() ||
      (latest?.image_path ? "[Image]" : null);

    return {
      ...thread,
      userEmail: emailMap.get(thread.userId) ?? null,
      userName: profile?.full_name != null ? String(profile.full_name) : null,
      lastPreview: preview,
      lastSenderRole: latest?.sender_role ?? null,
      needsAttention:
        thread.status === "open" &&
        latest?.sender_role != null &&
        latest.sender_role !== "admin",
    };
  });
}

export async function countSupportThreadsNeedingAttention(): Promise<number> {
  const db = admin();
  const { data: openThreads, error } = await db
    .from("support_threads")
    .select("id")
    .eq("status", "open");

  if (error) throw new Error(error.message);
  if (!openThreads?.length) return 0;

  const threadIds = openThreads.map((t) => String(t.id));
  const { data: messages, error: msgError } = await db
    .from("support_messages")
    .select("thread_id, sender_role, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  if (msgError) throw new Error(msgError.message);

  const latestRole = new Map<string, SupportSenderRole>();
  for (const msg of messages ?? []) {
    const tid = String(msg.thread_id);
    if (latestRole.has(tid)) continue;
    latestRole.set(tid, msg.sender_role as SupportSenderRole);
  }

  let count = 0;
  for (const id of threadIds) {
    const role = latestRole.get(id);
    if (role && role !== "admin") count += 1;
  }
  return count;
}
