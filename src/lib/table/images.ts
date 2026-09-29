import { createAdminClient } from "@/lib/supabase/admin";
import {
  signConciergeAttachments,
  uploadConciergeFiles,
} from "@/lib/storage/concierge-attachments";
import type { TableReferenceImage } from "@/types/table";

export const MAX_TABLE_REFERENCE_IMAGES = 3;

/** Upload inspiration photos and attach them to the request. */
export async function attachTableReferenceImages(
  requestId: string,
  files: File[],
): Promise<TableReferenceImage[]> {
  if (files.length === 0) return [];
  const uploaded = await uploadConciergeFiles(`table/${requestId}`, files, {
    imagesOnly: true,
    maxFiles: MAX_TABLE_REFERENCE_IMAGES,
  });
  if (uploaded.length === 0) return [];
  const db = createAdminClient();
  if (!db) return [];
  const { error } = await db
    .from("table_requests")
    .update({ reference_images: uploaded })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  return uploaded;
}

export async function signTableReferenceImages(
  images: TableReferenceImage[],
): Promise<string[]> {
  if (images.length === 0) return [];
  const signed = await signConciergeAttachments(images, 60 * 60 * 6);
  return signed.map((s) => s.url);
}
