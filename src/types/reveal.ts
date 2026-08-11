export type GiftReveal = {
  id: string;
  orderId: string;
  token: string;
  note: string | null;
  videoPath: string | null;
  photoPath: string | null;
  openedAt: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GiftRevealSummary = {
  token: string;
  hasVideo: boolean;
  hasPhoto: boolean;
  hasNote: boolean;
  openedAt: string | null;
  lockedAt: string | null;
  editable: boolean;
};

export const GIFT_REVEAL_VIDEO_MAX_BYTES = 80 * 1024 * 1024;
export const GIFT_REVEAL_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const GIFT_REVEAL_NOTE_MAX = 500;

export const PRE_SHIP_STATUSES = new Set([
  "confirmed",
  "pending_handover",
  "processing",
]);
