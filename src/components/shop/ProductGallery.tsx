"use client";

import { useState } from "react";
import Image from "next/image";

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : ["/images/kay-hero-luxury-box.png"];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-kay-surface">
        <Image
          src={gallery[active]}
          alt={name}
          width={720}
          height={900}
          className="aspect-[4/5] w-full object-cover"
          priority
        />
      </div>
      {gallery.length > 1 && (
        <div className="mt-4 flex gap-3">
          {gallery.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? "border-kay-fg" : "border-kay-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
