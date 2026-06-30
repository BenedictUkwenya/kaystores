"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  MAX_PRODUCT_IMAGES,
  uploadProductImage,
} from "@/lib/storage/product-images";

type Props = {
  vendorId: string;
  images: string[];
  onChange: (images: string[]) => void;
};

export function ProductImageUpload({ vendorId, images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotsLeft = MAX_PRODUCT_IMAGES - images.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || slotsLeft <= 0) return;

    setError(null);
    setUploading(true);

    const files = Array.from(fileList).slice(0, slotsLeft);
    const uploaded: string[] = [];

    try {
      for (const file of files) {
        const url = await uploadProductImage(vendorId, file);
        uploaded.push(url);
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
          Product photos
        </label>
        <span className="text-[11px] text-kay-subtle">
          {images.length}/{MAX_PRODUCT_IMAGES}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {images.map((src, index) => (
          <div
            key={src}
            className="group relative aspect-square overflow-hidden rounded-xl border border-kay-border-light bg-kay-surface"
          >
            <Image
              src={src}
              alt={`Product photo ${index + 1}`}
              fill
              sizes="120px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              aria-label="Remove image"
            >
              ×
            </button>
            {index === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white">
                Cover
              </span>
            )}
          </div>
        ))}

        {slotsLeft > 0 && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-kay-border bg-kay-surface/60 px-2 text-center transition-colors hover:border-kay-gold/50 hover:bg-kay-gold-light/20 disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-kay-border-light bg-kay-surface-elevated text-lg text-kay-muted">
              +
            </span>
            <span className="text-[10px] leading-tight text-kay-muted">
              {uploading ? "Uploading…" : "Add photo"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={slotsLeft > 1}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="mt-2 text-[12px] leading-relaxed text-kay-muted">
        Upload up to {MAX_PRODUCT_IMAGES} photos from your phone or computer (JPG,
        PNG, WebP — max 5 MB each). First image is the cover on Kay.
      </p>

      {error && (
        <p className="mt-2 text-[12px] text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
