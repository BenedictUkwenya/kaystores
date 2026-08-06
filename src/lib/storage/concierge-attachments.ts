import { createAdminClient } from "@/lib/supabase/admin";
import type { ConciergeAttachment } from "@/types/concierge";

export const CONCIERGE_ATTACHMENT_BUCKET = "concierge-attachments";
export const MAX_CONCIERGE_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_OFFER_IMAGES = 3;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
]);

const OFFER_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

export async function uploadConciergeFiles(
  pathPrefix: string,
  files: File[],
  options?: { imagesOnly?: boolean; maxFiles?: number },
): Promise<ConciergeAttachment[]> {
  const admin = createAdminClient();
  if (!admin) throw new Error("File storage is not configured.");

  const maxFiles = options?.maxFiles ?? files.length;
  const allowed = options?.imagesOnly ? OFFER_IMAGE_TYPES : ALLOWED_TYPES;
  const uploaded: ConciergeAttachment[] = [];

  for (const file of files.slice(0, maxFiles)) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (file.size > MAX_CONCIERGE_ATTACHMENT_BYTES) {
      throw new Error(`${file.name} exceeds the 10MB limit.`);
    }
    if (file.type && !allowed.has(file.type)) {
      throw new Error(
        options?.imagesOnly
          ? `${file.name} must be PNG or JPG.`
          : `${file.name} must be PNG, JPG, or PDF.`,
      );
    }

    const path = `${pathPrefix}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

    const { error } = await admin.storage
      .from(CONCIERGE_ATTACHMENT_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (error) throw new Error(`Could not upload ${file.name}.`);

    uploaded.push({
      name: file.name,
      path,
      contentType: file.type || "application/octet-stream",
    });
  }

  return uploaded;
}

export async function uploadConciergeAttachments(
  requestId: string,
  files: File[],
): Promise<ConciergeAttachment[]> {
  return uploadConciergeFiles(requestId, files);
}

export async function uploadOfferImages(
  requestId: string,
  assignmentId: string,
  files: File[],
): Promise<ConciergeAttachment[]> {
  return uploadConciergeFiles(`${requestId}/${assignmentId}`, files, {
    imagesOnly: true,
    maxFiles: MAX_OFFER_IMAGES,
  });
}

export async function signConciergeAttachments(
  attachments: ConciergeAttachment[],
  expiresIn = 3600,
): Promise<(ConciergeAttachment & { url: string })[]> {
  const admin = createAdminClient();
  if (!admin || attachments.length === 0) return [];

  const signed = await Promise.all(
    attachments.map(async (attachment) => {
      const { data, error } = await admin.storage
        .from(CONCIERGE_ATTACHMENT_BUCKET)
        .createSignedUrl(attachment.path, expiresIn);

      if (error || !data?.signedUrl) {
        return { ...attachment, url: "" };
      }

      return { ...attachment, url: data.signedUrl };
    }),
  );

  return signed.filter((item) => item.url);
}

export function parseStoredAttachments(raw: unknown): ConciergeAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const name = String(record.name ?? "");
    const path = String(record.path ?? "");
    if (!name || !path) return [];
    return [
      {
        name,
        path,
        contentType: String(record.contentType ?? "application/octet-stream"),
      },
    ];
  });
}
