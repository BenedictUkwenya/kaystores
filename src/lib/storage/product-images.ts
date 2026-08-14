import { createBrowserSupabase } from "@/lib/supabase/browser";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const KAY_PRODUCT_IMAGE_FOLDER = "kay";
export const MAX_PRODUCT_IMAGES = 3;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function contentTypeForImageName(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TYPES[ext] ?? null;
}

export function validateProductImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Use JPG, PNG, WebP, or GIF.";
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return "Each image must be under 5 MB.";
  }
  return null;
}

export async function uploadProductImage(
  vendorId: string,
  file: File,
): Promise<string> {
  const validationError = validateProductImageFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("Storage is not configured.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext.replace("jpeg", "jpg")
    : "jpg";
  const path = `${vendorId}/${crypto.randomUUID()}.${safeExt}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadProductImageAdmin(
  vendorId: string,
  bytes: Uint8Array,
  fileName: string,
): Promise<string> {
  const admin = createAdminClient();
  if (!admin) throw new Error("File storage is not configured.");

  const contentType = contentTypeForImageName(fileName);
  if (!contentType) throw new Error(`${fileName} must be JPG, PNG, WebP, or GIF.`);
  if (bytes.byteLength > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error(`${fileName} exceeds the 5MB limit.`);
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext.replace("jpeg", "jpg")
    : "jpg";
  const path = `${vendorId}/${crypto.randomUUID()}.${safeExt}`;

  const { error } = await admin.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, bytes, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (error) throw new Error(`Could not upload ${fileName}.`);

  const { data } = admin.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

