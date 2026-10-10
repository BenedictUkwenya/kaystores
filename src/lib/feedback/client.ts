import { createClient } from "@/lib/supabase/client";
import type { FeedbackCategory, FeedbackComment, FeedbackPost, FeedbackStatus } from "@/types/feedback";

const BUCKET = "feedback-screenshots";

type PostRow = {
  id: string;
  user_id: string;
  author_name: string;
  category: FeedbackCategory;
  title: string;
  body: string;
  screenshot_path: string | null;
  status: FeedbackStatus;
  staff_reply: string | null;
  created_at: string;
  feedback_votes: { user_id: string }[] | null;
  feedback_comments: { count: number }[] | null;
};

function mapPost(row: PostRow, userId: string): FeedbackPost {
  const votes = row.feedback_votes ?? [];
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    category: row.category,
    title: row.title,
    body: row.body,
    screenshotPath: row.screenshot_path,
    status: row.status,
    staffReply: row.staff_reply,
    createdAt: row.created_at,
    votes: votes.length,
    comments: row.feedback_comments?.[0]?.count ?? 0,
    voted: votes.some((vote) => vote.user_id === userId),
  };
}

export async function listFeedbackPosts(userId: string): Promise<FeedbackPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feedback_posts")
    .select(
      "id, user_id, author_name, category, title, body, screenshot_path, status, staff_reply, created_at, feedback_votes(user_id), feedback_comments(count)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return ((data ?? []) as PostRow[]).map((row) => mapPost(row, userId));
}

export async function listFeedbackComments(postId: string): Promise<FeedbackComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feedback_comments")
    .select("id, post_id, author_name, is_staff, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    postId: row.post_id,
    authorName: row.author_name,
    isStaff: row.is_staff,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function createFeedbackPost(input: {
  category: FeedbackCategory;
  title: string;
  body: string;
  screenshot?: File | null;
  userId: string;
}) {
  const supabase = createClient();
  let screenshotPath: string | null = null;
  if (input.screenshot) {
    const ext = input.screenshot.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${input.userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, input.screenshot, {
      contentType: input.screenshot.type,
    });
    if (error) throw new Error(error.message);
    screenshotPath = path;
  }
  const { error } = await supabase.from("feedback_posts").insert({
    category: input.category,
    title: input.title.trim(),
    body: input.body.trim(),
    screenshot_path: screenshotPath,
  });
  if (error) throw new Error(error.message);
}

export async function toggleFeedbackVote(post: FeedbackPost, userId: string) {
  const supabase = createClient();
  const result = post.voted
    ? await supabase.from("feedback_votes").delete().eq("post_id", post.id).eq("user_id", userId)
    : await supabase.from("feedback_votes").insert({ post_id: post.id });
  if (result.error && result.error.code !== "23505") throw new Error(result.error.message);
}

export async function addFeedbackComment(postId: string, body: string) {
  const supabase = createClient();
  const { error } = await supabase.from("feedback_comments").insert({
    post_id: postId,
    body: body.trim(),
  });
  if (error) throw new Error(error.message);
}

export async function updateFeedbackStaff(input: {
  id: string;
  status?: FeedbackStatus;
  staffReply?: string | null;
}) {
  const supabase = createClient();
  const patch: { status?: FeedbackStatus; staff_reply?: string | null } = {};
  if (input.status) patch.status = input.status;
  if (input.staffReply !== undefined) patch.staff_reply = input.staffReply;
  const { error } = await supabase.from("feedback_posts").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function deleteFeedbackPost(post: FeedbackPost) {
  const supabase = createClient();
  const { error } = await supabase.from("feedback_posts").delete().eq("id", post.id);
  if (error) throw new Error(error.message);
  if (post.screenshotPath) {
    await supabase.storage.from(BUCKET).remove([post.screenshotPath]);
  }
}

export async function feedbackScreenshotUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
