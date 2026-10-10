export type FeedbackCategory = "idea" | "bug" | "tip" | "praise";
export type FeedbackStatus =
  | "open"
  | "under_review"
  | "planned"
  | "in_progress"
  | "done"
  | "declined";

export type FeedbackPost = {
  id: string;
  userId: string;
  authorName: string;
  category: FeedbackCategory;
  title: string;
  body: string;
  screenshotPath: string | null;
  status: FeedbackStatus;
  staffReply: string | null;
  createdAt: string;
  votes: number;
  comments: number;
  voted: boolean;
};

export type FeedbackComment = {
  id: string;
  postId: string;
  authorName: string;
  isStaff: boolean;
  body: string;
  createdAt: string;
};
