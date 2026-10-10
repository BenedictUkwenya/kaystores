"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FeedbackCategory, FeedbackComment, FeedbackPost, FeedbackStatus } from "@/types/feedback";
import {
  addFeedbackComment,
  createFeedbackPost,
  deleteFeedbackPost,
  feedbackScreenshotUrl,
  listFeedbackComments,
  listFeedbackPosts,
  toggleFeedbackVote,
  updateFeedbackStaff,
} from "@/lib/feedback/client";

const CATEGORIES: Record<FeedbackCategory, { label: string; plural: string }> = {
  idea: { label: "Idea", plural: "Ideas" },
  bug: { label: "Bug", plural: "Bugs" },
  tip: { label: "Tip", plural: "Tips" },
  praise: { label: "Praise", plural: "Praise" },
};

const KIND_COPY: Record<FeedbackCategory, string> = {
  idea: "Something Kay should build",
  bug: "Something that broke",
  tip: "A better way to shop",
  praise: "Something you loved",
};

const STATUSES: Record<FeedbackStatus, string> = {
  open: "New",
  under_review: "Under review",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

function ago(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function Shot({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void feedbackScreenshotUrl(path).then((next) => {
      if (live) setUrl(next);
    });
    return () => {
      live = false;
    };
  }, [path]);
  if (!url) return <div className="kay-fb-shot kay-fb-shot--empty" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="kay-fb-shot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Attached screenshot" />
    </a>
  );
}

export function FeedbackBoard({
  userId,
  isStaff,
  embedded = false,
}: {
  userId: string | null;
  isStaff: boolean;
  embedded?: boolean;
}) {
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [sort, setSort] = useState<"top" | "new">("top");
  const [composing, setComposing] = useState(false);
  const [composeCategory, setComposeCategory] = useState<FeedbackCategory>("idea");
  const [openId, setOpenId] = useState<string | null>(null);

  async function reload() {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      setPosts(await listFeedbackPosts(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The board could not load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // userId is the only input that should refetch the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const visible = useMemo(() => {
    const list = posts.filter(
      (post) =>
        (category === "all" || post.category === category) &&
        (status === "all" || post.status === status),
    );
    if (sort === "new") return list;
    return [...list].sort(
      (a, b) => b.votes - a.votes || +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [posts, category, status, sort]);

  const openPost = posts.find((post) => post.id === openId) ?? null;

  async function vote(post: FeedbackPost) {
    if (!userId) return;
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? { ...item, voted: !item.voted, votes: item.votes + (item.voted ? -1 : 1) }
          : item,
      ),
    );
    try {
      await toggleFeedbackVote(post, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that vote.");
      void reload();
    }
  }

  function openComposer(category: FeedbackCategory = "idea") {
    setComposeCategory(category);
    setComposing(true);
  }

  if (!userId) {
    return (
      <section className="kay-fb-gate">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kay-gold">Kay circle</p>
        <h1 className="mt-3 font-serif text-[40px] leading-[0.95] text-kay-fg sm:text-[56px]">
          Share your feedback.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-kay-muted">
          Ideas, bugs, tips, and praise live on one board. Sign in to post, vote, and see what Kay is already working on.
        </p>
        <ul className="kay-fb-kinds">
          {(Object.keys(CATEGORIES) as FeedbackCategory[]).map((key, index) => (
            <li key={key} style={{ animationDelay: `${120 + index * 70}ms` }}>
              <span className={`kay-fb-pill kay-fb-pill--${key}`}>{CATEGORIES[key].label}</span>
              <span>{KIND_COPY[key]}</span>
            </li>
          ))}
        </ul>
        <Link href="/login?next=/feedback" className="kay-fb-primary mt-8">
          Sign in to the board
        </Link>
      </section>
    );
  }

  return (
    <div className={embedded ? "" : "kay-fb-page"}>
      {!embedded && (
        <header className="kay-fb-hero">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kay-gold">The board</p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-[40px] leading-[0.95] text-kay-fg sm:text-[56px]">
                Share your feedback.
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-kay-muted">
                An idea, a bug, a tip, or something you loved. Upvote what matters. Kay replies here.
              </p>
            </div>
            <button type="button" className="kay-fb-primary" onClick={() => openComposer()}>
              Share feedback
            </button>
          </div>
          <ul className="kay-fb-kinds kay-fb-kinds--act">
            {(Object.keys(CATEGORIES) as FeedbackCategory[]).map((key, index) => (
              <li key={key} style={{ animationDelay: `${80 + index * 60}ms` }}>
                <button type="button" onClick={() => openComposer(key)}>
                  <span className={`kay-fb-pill kay-fb-pill--${key}`}>{CATEGORIES[key].label}</span>
                  <span>{KIND_COPY[key]}</span>
                </button>
              </li>
            ))}
          </ul>
        </header>
      )}

      {embedded && (
        <div className="mb-5 flex justify-end">
          <button type="button" className="kay-fb-primary" onClick={() => openComposer()}>
            Share feedback
          </button>
        </div>
      )}

      <div className="kay-fb-toolbar">
        <div className="kay-fb-chips">
          <button
            type="button"
            className={`kay-fb-chip ${category === "all" ? "is-on" : ""}`}
            onClick={() => setCategory("all")}
          >
            All
          </button>
          {(Object.keys(CATEGORIES) as FeedbackCategory[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`kay-fb-chip ${category === key ? "is-on" : ""}`}
              onClick={() => setCategory(key)}
            >
              {CATEGORIES[key].plural}
            </button>
          ))}
        </div>
        <div className="kay-fb-filters">
          <select value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")} aria-label="Status">
            <option value="all">All statuses</option>
            {(Object.keys(STATUSES) as FeedbackStatus[]).map((key) => (
              <option key={key} value={key}>
                {STATUSES[key]}
              </option>
            ))}
          </select>
          <div className="kay-fb-sort">
            <button type="button" className={sort === "top" ? "is-on" : ""} onClick={() => setSort("top")}>
              Top
            </button>
            <button type="button" className={sort === "new" ? "is-on" : ""} onClick={() => setSort("new")}>
              New
            </button>
          </div>
        </div>
      </div>

      {error && <p className="kay-fb-error">{error}</p>}

      {loading ? (
        <div className="kay-fb-list">
          {[0, 1, 2].map((item) => (
            <div key={item} className="kay-fb-skeleton" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="kay-fb-empty">
          <p className="font-serif text-[28px] text-kay-fg">
            {posts.length ? "Nothing in this view" : "The board is quiet"}
          </p>
          <p className="mt-2 text-[14px] text-kay-muted">
            {posts.length ? "Try another filter." : "Be the first to tell Kay what would make a gift better."}
          </p>
        </div>
      ) : (
        <ul className="kay-fb-list">
          {visible.map((post, index) => (
            <li key={post.id} style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
              <article className="kay-fb-card">
                <button
                  type="button"
                  className={`kay-fb-vote ${post.voted ? "is-on" : ""}`}
                  aria-pressed={post.voted}
                  onClick={() => void vote(post)}
                >
                  <span aria-hidden>▲</span>
                  {post.votes}
                </button>
                <button type="button" className="kay-fb-card-main" onClick={() => setOpenId(post.id)}>
                  <div className="kay-fb-meta">
                    <span className={`kay-fb-pill kay-fb-pill--${post.category}`}>{CATEGORIES[post.category].label}</span>
                    {post.status !== "open" && <span className="kay-fb-pill">{STATUSES[post.status]}</span>}
                    {post.staffReply && <span className="kay-fb-pill kay-fb-pill--gold">Kay replied</span>}
                  </div>
                  <h2>{post.title}</h2>
                  {post.body && <p>{post.body}</p>}
                  <p className="kay-fb-byline">
                    {post.authorName} · {ago(post.createdAt)} · {post.comments} comments
                  </p>
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}

      {composing && (
        <Composer
          userId={userId}
          initialCategory={composeCategory}
          onClose={() => setComposing(false)}
          onSaved={() => {
            setComposing(false);
            void reload();
          }}
        />
      )}

      {openPost && (
        <PostSheet
          post={openPost}
          isStaff={isStaff}
          canDelete={isStaff || openPost.userId === userId}
          onVote={() => void vote(openPost)}
          onClose={() => setOpenId(null)}
          onChanged={() => void reload()}
        />
      )}
    </div>
  );
}

function Composer({
  userId,
  initialCategory,
  onClose,
  onSaved,
}: {
  userId: string;
  initialCategory: FeedbackCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [shot, setShot] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 3) {
      setError("Give it a title of at least 3 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createFeedbackPost({ category, title, body, screenshot: shot, userId });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post that.");
      setBusy(false);
    }
  }

  return (
    <div className="kay-fb-sheet" role="dialog" aria-label="Share feedback">
      <button type="button" className="kay-fb-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <form className="kay-fb-sheet-card" onSubmit={(event) => void submit(event)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">New note</p>
            <h2 className="mt-1 font-serif text-[28px] text-kay-fg">Share feedback</h2>
          </div>
          <button type="button" className="kay-fb-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="kay-fb-chips mt-5">
          {(Object.keys(CATEGORIES) as FeedbackCategory[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`kay-fb-chip ${category === key ? "is-on" : ""}`}
              onClick={() => setCategory(key)}
            >
              {CATEGORIES[key].label}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-[13px] font-medium text-kay-fg">
          Title
          <input
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={category === "bug" ? "What went wrong?" : "Sum it up in a line"}
            className="kay-fb-input mt-1.5"
          />
        </label>
        <label className="mt-4 block text-[13px] font-medium text-kay-fg">
          Details
          <textarea
            value={body}
            maxLength={4000}
            rows={5}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Leave out card numbers, passwords, and other private details."
            className="kay-fb-input mt-1.5"
          />
        </label>
        <label className="kay-fb-file mt-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              if (file && file.size > 5 * 1024 * 1024) {
                setError("Screenshot must be under 5 MB.");
                return;
              }
              setShot(file);
            }}
          />
          {shot ? shot.name : "Attach a screenshot"}
        </label>
        {error && <p className="kay-fb-error">{error}</p>}
        <button type="submit" className="kay-fb-primary mt-5 w-full sm:w-auto" disabled={busy}>
          {busy ? "Posting…" : "Post to the board"}
        </button>
      </form>
    </div>
  );
}

function PostSheet({
  post,
  isStaff,
  canDelete,
  onVote,
  onClose,
  onChanged,
}: {
  post: FeedbackPost;
  isStaff: boolean;
  canDelete: boolean;
  onVote: () => void;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [comment, setComment] = useState("");
  const [reply, setReply] = useState(post.staffReply ?? "");
  const [status, setStatus] = useState(post.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    void listFeedbackComments(post.id).then((rows) => {
      if (live) setComments(rows);
    });
    return () => {
      live = false;
    };
  }, [post.id]);

  async function sendComment(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError("");
    try {
      await addFeedbackComment(post.id, comment);
      setComment("");
      setComments(await listFeedbackComments(post.id));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post that comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kay-fb-sheet" role="dialog" aria-label={post.title}>
      <button type="button" className="kay-fb-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="kay-fb-sheet-card kay-fb-sheet-card--tall">
        <div className="flex items-start justify-between gap-3">
          <div className="kay-fb-meta">
            <span className={`kay-fb-pill kay-fb-pill--${post.category}`}>{CATEGORIES[post.category].label}</span>
            <span className="kay-fb-pill">{STATUSES[post.status]}</span>
          </div>
          <button type="button" className="kay-fb-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <h2 className="mt-4 font-serif text-[30px] leading-tight text-kay-fg">{post.title}</h2>
        <p className="mt-1 text-[12px] text-kay-subtle">
          {post.authorName} · {ago(post.createdAt)}
        </p>
        <div className="mt-5 flex gap-4">
          <button type="button" className={`kay-fb-vote ${post.voted ? "is-on" : ""}`} onClick={onVote}>
            <span aria-hidden>▲</span>
            {post.votes}
          </button>
          <div className="min-w-0 flex-1">
            {post.body && <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-kay-muted">{post.body}</p>}
            {post.screenshotPath && <Shot path={post.screenshotPath} />}
          </div>
        </div>
        {post.staffReply && (
          <div className="kay-fb-reply">
            <p>Kay</p>
            {post.staffReply}
          </div>
        )}
        {isStaff && (
          <div className="kay-fb-staff">
            <p>Team</p>
            <select value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus)}>
              {(Object.keys(STATUSES) as FeedbackStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUSES[key]}
                </option>
              ))}
            </select>
            <textarea value={reply} rows={3} maxLength={4000} onChange={(event) => setReply(event.target.value)} placeholder="Official reply" />
            <button
              type="button"
              className="kay-fb-primary"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void updateFeedbackStaff({ id: post.id, status, staffReply: reply.trim() || null })
                  .then(() => {
                    onChanged();
                    setBusy(false);
                  })
                  .catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : "Could not save.");
                    setBusy(false);
                  });
              }}
            >
              Save reply
            </button>
          </div>
        )}
        <div className="mt-6 space-y-3">
          <p className="text-[13px] font-semibold text-kay-fg">Comments</p>
          {comments.map((item) => (
            <div key={item.id} className={`kay-fb-comment ${item.isStaff ? "is-staff" : ""}`}>
              <p>
                {item.authorName} · {ago(item.createdAt)}
              </p>
              {item.body}
            </div>
          ))}
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => void sendComment(event)}>
            <input
              value={comment}
              maxLength={2000}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a comment"
              className="kay-fb-input"
            />
            <button type="submit" className="kay-fb-primary" disabled={busy || !comment.trim()}>
              Post
            </button>
          </form>
        </div>
        {error && <p className="kay-fb-error">{error}</p>}
        {canDelete && (
          <button
            type="button"
            className="kay-fb-ghost mt-6 text-red-600"
            onClick={() => {
              if (!window.confirm("Delete this post?")) return;
              void deleteFeedbackPost(post).then(() => {
                onChanged();
                onClose();
              });
            }}
          >
            Delete post
          </button>
        )}
      </div>
    </div>
  );
}
