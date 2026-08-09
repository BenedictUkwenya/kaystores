import { createAdminClient } from "@/lib/supabase/admin";

export const SUPPORT_ATTACHMENT_BUCKET = "support-attachments";
export const MAX_SUPPORT_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

export async function uploadSupportImage(
  userId: string,
  threadId: string,
  file: File,
): Promise<string> {
  const admin = createAdminClient();
  if (!admin) throw new Error("File storage is not configured.");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Invalid image file.");
  }
  if (file.size > MAX_SUPPORT_ATTACHMENT_BYTES) {
    throw new Error("Image exceeds the 5MB limit.");
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("Image must be PNG, JPG, or WebP.");
  }

  const path = `${userId}/${threadId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error } = await admin.storage
    .from(SUPPORT_ATTACHMENT_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) throw new Error("Could not upload image.");
  return path;
}

export async function signSupportImage(
  imagePath: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!imagePath) return null;
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.storage
    .from(SUPPORT_ATTACHMENT_BUCKET)
    .createSignedUrl(imagePath, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function signSupportMessages<
  T extends { imagePath: string | null },
>(messages: T[]): Promise<(T & { imageUrl: string | null })[]> {
  return Promise.all(
    messages.map(async (message) => ({
      ...message,
      imageUrl: await signSupportImage(message.imagePath),
    })),
  );
}
