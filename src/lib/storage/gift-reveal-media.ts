import { createAdminClient } from "@/lib/supabase/admin";
import {
  GIFT_REVEAL_PHOTO_MAX_BYTES,
  GIFT_REVEAL_VIDEO_MAX_BYTES,
} from "@/types/reveal";

export const GIFT_REVEAL_BUCKET = "gift-reveal-media";

const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const PHOTO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

export function assertRevealMediaFile(
  file: { name: string; size: number; type: string },
  kind: "video" | "photo",
): void {
  if (!file || file.size === 0) {
    throw new Error("Invalid file.");
  }
  if (kind === "video") {
    if (file.size > GIFT_REVEAL_VIDEO_MAX_BYTES) {
      throw new Error("Video exceeds the 80MB limit.");
    }
    if (file.type && !VIDEO_TYPES.has(file.type)) {
      throw new Error("Video must be MP4, WebM, or MOV.");
    }
  } else {
    if (file.size > GIFT_REVEAL_PHOTO_MAX_BYTES) {
      throw new Error("Photo exceeds the 8MB limit.");
    }
    if (file.type && !PHOTO_TYPES.has(file.type)) {
      throw new Error("Photo must be PNG, JPG, or WebP.");
    }
  }
}

export async function createRevealUploadUrl(
  orderId: string,
  kind: "video" | "photo",
  fileName: string,
  contentType?: string,
): Promise<{ path: string; token: string; signedUrl: string }> {
  const admin = createAdminClient();
  if (!admin) throw new Error("File storage is not configured.");

  const path = `${orderId}/${kind}-${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
  const { data, error } = await admin.storage
    .from(GIFT_REVEAL_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Could not prepare ${kind} upload.`);
  }

  // contentType reserved for future validation headers
  void contentType;

  return {
    path: data.path ?? path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export async function uploadRevealMedia(
  orderId: string,
  file: File,
  kind: "video" | "photo",
): Promise<string> {
  assertRevealMediaFile(file, kind);
  const admin = createAdminClient();
  if (!admin) throw new Error("File storage is not configured.");

  const path = `${orderId}/${kind}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error } = await admin.storage.from(GIFT_REVEAL_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(`Could not upload ${kind}.`);
  return path;
}

export async function signRevealMedia(
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.storage
    .from(GIFT_REVEAL_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
