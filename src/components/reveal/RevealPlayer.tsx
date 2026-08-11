"use client";

type Props = {
  videoUrl?: string | null;
  photoUrl?: string | null;
  note?: string | null;
};

export function RevealPlayer({ videoUrl, photoUrl, note }: Props) {
  return (
    <div className="space-y-5">
      {note?.trim() && (
        <blockquote className="border-l-2 border-kay-gold bg-kay-surface/60 px-4 py-3 font-serif text-[17px] leading-relaxed text-kay-fg italic">
          “{note.trim()}”
        </blockquote>
      )}

      {photoUrl && (
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Gift photo"
            className="max-h-[70vh] w-full object-contain bg-black/5"
          />
          <Watermark />
        </div>
      )}

      {videoUrl && (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video
            src={videoUrl}
            controls
            playsInline
            className="max-h-[70vh] w-full"
          />
          <Watermark />
        </div>
      )}
    </div>
  );
}

function Watermark() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/icon-512.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-3 h-9 w-9 opacity-55 drop-shadow-md"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/icon-512.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
      />
    </>
  );
}
