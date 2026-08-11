"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KayQrCode } from "@/components/reveal/KayQrCode";
import { GIFT_REVEAL_NOTE_MAX } from "@/types/reveal";
import { IconUpload } from "@/components/ui/Icons";

type RevealState = {
  token: string;
  note: string | null;
  hasVideo: boolean;
  hasPhoto: boolean;
  openedAt: string | null;
  lockedAt: string | null;
  editable: boolean;
  url: string;
  videoUrl: string | null;
  photoUrl: string | null;
  qrDataUrl: string | null;
};

type Props = {
  orderId: string;
  buyerEmail: string;
  initialNote?: string;
  compact?: boolean;
};

export function GiftRevealComposer({
  orderId,
  buyerEmail,
  initialNote = "",
  compact = false,
}: Props) {
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [note, setNote] = useState(initialNote);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/orders/${orderId}/reveal?email=${encodeURIComponent(buyerEmail)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load Reveal.");
        return;
      }
      setReveal(data.reveal);
      if (data.reveal?.note != null) setNote(data.reveal.note);
      setError(null);
    } catch {
      setError("Could not load Reveal.");
    } finally {
      setLoading(false);
    }
  }, [orderId, buyerEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(opts?: { clearVideo?: boolean; clearPhoto?: boolean }) {
    if (!reveal?.editable) return;
    setSaving(true);
    setError(null);
    try {
      const { uploadRevealFileDirect } = await import(
        "@/lib/reveal/client-upload"
      );
      let videoPath: string | undefined;
      let photoPath: string | undefined;
      if (videoFile) {
        videoPath = await uploadRevealFileDirect({
          orderId,
          buyerEmail,
          file: videoFile,
          kind: "video",
        });
      }
      if (photoFile) {
        photoPath = await uploadRevealFileDirect({
          orderId,
          buyerEmail,
          file: photoFile,
          kind: "photo",
        });
      }

      const res = await fetch(`/api/orders/${orderId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerEmail,
          note,
          videoPath,
          photoPath,
          clearVideo: opts?.clearVideo,
          clearPhoto: opts?.clearPhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save Reveal.");
        return;
      }
      setReveal(data.reveal);
      setVideoFile(null);
      setPhotoFile(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (photoInputRef.current) photoInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save Reveal.");
    } finally {
      setSaving(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : undefined,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoFile(new File([blob], `kay-reveal-${Date.now()}.webm`, { type: "video/webm" }));
        setRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Camera access was denied or unavailable. Upload a video instead.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function copyLink() {
    if (!reveal?.url) return;
    await navigator.clipboard.writeText(reveal.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <p className="py-6 text-center text-[13px] text-kay-muted">
        Loading Kay Reveal…
      </p>
    );
  }

  if (!reveal) {
    return (
      <p className="py-6 text-center text-[13px] text-red-600">
        {error || "Reveal unavailable."}
      </p>
    );
  }

  return (
    <div
      className={
        compact
          ? "space-y-4"
          : "rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] sm:p-6"
      }
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
          Kay Reveal
        </p>
        <h2 className="mt-1 font-serif text-[22px] text-kay-fg">
          A message for the box
        </h2>
        <p className="mt-1 text-[13px] text-kay-muted">
          Add a video, photo, and/or note. Your recipient opens it by scanning
          the Kay QR on the package.
        </p>
        <p className="mt-2 text-[12px] text-kay-subtle">
          {reveal.openedAt
            ? `Opened ${new Date(reveal.openedAt).toLocaleString()}`
            : "Not opened yet"}
          {!reveal.editable && " · Editing locked"}
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-2">
          <KayQrCode value={reveal.url} size={compact ? 160 : 200} />
          <button
            type="button"
            onClick={() => void copyLink()}
            className="text-[12px] text-kay-muted underline-offset-2 hover:text-kay-fg hover:underline"
          >
            {copied ? "Link copied" : "Copy reveal link"}
          </button>
          {reveal.qrDataUrl && (
            <a
              href={reveal.qrDataUrl}
              download="kay-reveal-qr.png"
              className="text-[12px] text-kay-muted underline-offset-2 hover:text-kay-fg hover:underline"
            >
              Download QR PNG
            </a>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-kay-fg">
              Reveal note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, GIFT_REVEAL_NOTE_MAX))}
              disabled={!reveal.editable}
              rows={3}
              maxLength={GIFT_REVEAL_NOTE_MAX}
              className="mt-1 w-full resize-none rounded-xl border border-kay-border-light bg-kay-surface px-3 py-2.5 text-[14px] text-kay-fg outline-none focus:border-kay-gold disabled:opacity-60"
              placeholder="A few words they’ll see when they open the Reveal…"
            />
            <p className="mt-1 text-[11px] text-kay-subtle">
              {note.length}/{GIFT_REVEAL_NOTE_MAX}
            </p>
          </div>

          {reveal.editable && (
            <>
              <div className="flex flex-wrap gap-2">
                {!recording ? (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    className="inline-flex h-10 items-center rounded-full border border-kay-fg px-4 text-[12px] font-medium text-kay-fg"
                  >
                    Record video
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex h-10 items-center rounded-full bg-red-600 px-4 text-[12px] font-medium text-white"
                  >
                    Stop recording
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-kay-border-light px-4 text-[12px] text-kay-fg"
                >
                  <IconUpload className="h-3.5 w-3.5" />
                  Upload video
                </button>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-kay-border-light px-4 text-[12px] text-kay-fg"
                >
                  <IconUpload className="h-3.5 w-3.5" />
                  Upload photo
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {(videoFile || photoFile) && (
                <p className="text-[12px] text-kay-muted">
                  {videoFile ? `Video ready: ${videoFile.name}` : null}
                  {videoFile && photoFile ? " · " : null}
                  {photoFile ? `Photo ready: ${photoFile.name}` : null}
                </p>
              )}

              {(reveal.hasVideo || reveal.hasPhoto) && (
                <div className="flex flex-wrap gap-3 text-[12px]">
                  {reveal.hasVideo && (
                    <button
                      type="button"
                      onClick={() => void save({ clearVideo: true })}
                      className="text-kay-muted underline-offset-2 hover:underline"
                    >
                      Remove video
                    </button>
                  )}
                  {reveal.hasPhoto && (
                    <button
                      type="button"
                      onClick={() => void save({ clearPhoto: true })}
                      className="text-kay-muted underline-offset-2 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-kay-accent px-6 text-[13px] font-medium text-kay-accent-fg disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Reveal"}
              </button>
            </>
          )}

          {(reveal.videoUrl || reveal.photoUrl) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {reveal.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reveal.photoUrl}
                  alt="Reveal photo"
                  className="max-h-40 rounded-lg object-cover"
                />
              )}
              {reveal.videoUrl && (
                <video
                  src={reveal.videoUrl}
                  controls
                  className="max-h-40 w-full rounded-lg bg-black"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-600">{error}</p>
      )}
    </div>
  );
}
