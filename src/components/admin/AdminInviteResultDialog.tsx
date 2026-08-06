"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  variant: "success" | "error";
  title: string;
  message: string;
  inviteUrl?: string;
  onClose: () => void;
};

export function AdminInviteResultDialog({
  open,
  variant,
  title,
  message,
  inviteUrl,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  const isSuccess = variant === "success";

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-result-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] ${
              isSuccess
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
            aria-hidden
          >
            {isSuccess ? "✓" : "!"}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="invite-result-title"
              className="font-serif text-[22px] leading-snug text-kay-fg"
            >
              {title}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-kay-muted">
              {message}
            </p>

            {inviteUrl && (
              <div className="mt-4 rounded-xl border border-kay-border-light bg-kay-surface p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kay-subtle">
                  Invite link
                </p>
                <p className="mt-1 break-all text-[12px] leading-relaxed text-kay-fg">
                  {inviteUrl}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={copyLink}
                >
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
